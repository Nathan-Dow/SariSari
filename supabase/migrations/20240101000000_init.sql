-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
create type log_reason as enum ('sale', 'restock', 'adjustment', 'waste');

-- ============================================================
-- TABLES
-- ============================================================

create table public.products (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  sku         text unique not null,
  barcode     text unique,
  price       numeric(10,2) not null check (price >= 0),
  cost        numeric(10,2) check (cost >= 0),
  stock       integer not null default 0 check (stock >= 0),
  category    text,
  image_url   text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.transactions (
  id              uuid primary key default uuid_generate_v4(),
  cashier_id      uuid not null references auth.users(id),
  total_amount    numeric(10,2) not null check (total_amount >= 0),
  payment_method  text not null default 'cash',
  status          text not null default 'completed',
  created_at      timestamptz not null default now()
);

create table public.transaction_items (
  id              uuid primary key default uuid_generate_v4(),
  transaction_id  uuid not null references public.transactions(id) on delete cascade,
  product_id      uuid not null references public.products(id),
  quantity        integer not null check (quantity > 0),
  unit_price      numeric(10,2) not null check (unit_price >= 0),
  subtotal        numeric(10,2) generated always as (quantity * unit_price) stored,
  created_at      timestamptz not null default now()
);

create table public.inventory_logs (
  id           uuid primary key default uuid_generate_v4(),
  product_id   uuid not null references public.products(id),
  delta        integer not null,
  reason       log_reason not null,
  reference_id uuid,
  performed_by uuid references auth.users(id),
  note         text,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_products_barcode        on public.products(barcode);
create index idx_products_sku            on public.products(sku);
create index idx_products_is_active      on public.products(is_active);
create index idx_transactions_created_at on public.transactions(created_at desc);
create index idx_transactions_cashier    on public.transactions(cashier_id);
create index idx_transaction_items_tx    on public.transaction_items(transaction_id);
create index idx_inventory_logs_product  on public.inventory_logs(product_id);
create index idx_inventory_logs_created  on public.inventory_logs(created_at desc);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.products          enable row level security;
alter table public.transactions      enable row level security;
alter table public.transaction_items enable row level security;
alter table public.inventory_logs    enable row level security;

-- Role helper: reads role from JWT app_metadata (set server-side, not spoofable)
create or replace function public.get_user_role()
returns text language sql stable as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), 'staff');
$$;

-- PRODUCTS
create policy "authenticated read active products"
  on public.products for select
  to authenticated
  using (is_active = true);

create policy "managers manage products"
  on public.products for all
  to authenticated
  using (public.get_user_role() = 'manager')
  with check (public.get_user_role() = 'manager');

-- TRANSACTIONS
create policy "staff insert own transactions"
  on public.transactions for insert
  to authenticated
  with check (cashier_id = auth.uid());

create policy "read transactions by role"
  on public.transactions for select
  to authenticated
  using (cashier_id = auth.uid() or public.get_user_role() = 'manager');

-- TRANSACTION ITEMS
create policy "read transaction items"
  on public.transaction_items for select
  to authenticated
  using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id
        and (t.cashier_id = auth.uid() or public.get_user_role() = 'manager')
    )
  );

-- Inserts handled exclusively via SECURITY DEFINER RPC
create policy "rpc insert transaction items"
  on public.transaction_items for insert
  to authenticated
  with check (true);

-- INVENTORY LOGS
create policy "managers read inventory logs"
  on public.inventory_logs for select
  to authenticated
  using (public.get_user_role() = 'manager');

create policy "rpc insert inventory logs"
  on public.inventory_logs for insert
  to authenticated
  with check (true);

-- ============================================================
-- CHECKOUT RPC
-- Atomically: validates stock, decrements inventory,
-- records transaction + line items + audit log
-- ============================================================
create type checkout_item as (
  product_id uuid,
  quantity   integer
);

create or replace function public.process_checkout(
  p_items          checkout_item[],
  p_payment_method text default 'cash'
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction_id uuid;
  v_total          numeric(10,2) := 0;
  v_item           checkout_item;
  v_product        record;
begin
  -- 1. Validate stock and accumulate total (lock rows to prevent race conditions)
  foreach v_item in array p_items loop
    select id, name, price, stock
      into v_product
      from public.products
      where id = v_item.product_id
        and is_active = true
      for update;

    if not found then
      raise exception 'Product % not found or inactive', v_item.product_id
        using errcode = 'P0002';
    end if;

    if v_product.stock < v_item.quantity then
      raise exception 'Insufficient stock for "%". Available: %, requested: %',
        v_product.name, v_product.stock, v_item.quantity
        using errcode = 'P0003';
    end if;

    v_total := v_total + (v_product.price * v_item.quantity);
  end loop;

  -- 2. Insert transaction header
  insert into public.transactions (cashier_id, total_amount, payment_method)
  values (auth.uid(), v_total, p_payment_method)
  returning id into v_transaction_id;

  -- 3. Insert line items, decrement stock, write audit log
  foreach v_item in array p_items loop
    select id, price into v_product
      from public.products where id = v_item.product_id;

    insert into public.transaction_items (transaction_id, product_id, quantity, unit_price)
    values (v_transaction_id, v_item.product_id, v_item.quantity, v_product.price);

    update public.products
    set stock = stock - v_item.quantity
    where id = v_item.product_id;

    insert into public.inventory_logs (product_id, delta, reason, reference_id, performed_by)
    values (v_item.product_id, -v_item.quantity, 'sale', v_transaction_id, auth.uid());
  end loop;

  return json_build_object(
    'transaction_id', v_transaction_id,
    'total_amount',   v_total,
    'created_at',     now()
  );
end;
$$;

grant execute on function public.process_checkout(checkout_item[], text) to authenticated;

-- ============================================================
-- HOURLY REVENUE RPC
-- Returns revenue grouped by hour for the last N hours
-- ============================================================
create or replace function public.get_hourly_revenue(p_hours integer default 24)
returns table (
  hour_bucket timestamptz,
  revenue     numeric(10,2),
  tx_count    bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    date_trunc('hour', created_at) as hour_bucket,
    sum(total_amount)::numeric(10,2) as revenue,
    count(*) as tx_count
  from public.transactions
  where
    created_at >= now() - (p_hours || ' hours')::interval
    and status = 'completed'
  group by date_trunc('hour', created_at)
  order by hour_bucket asc;
$$;

grant execute on function public.get_hourly_revenue(integer) to authenticated;
