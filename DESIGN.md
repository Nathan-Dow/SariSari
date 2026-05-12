---
name: Precision Retail Logic
colors:
  surface: '#f7fafc'
  surface-dim: '#d7dadc'
  surface-bright: '#f7fafc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f6'
  surface-container: '#ebeef0'
  surface-container-high: '#e5e9eb'
  surface-container-highest: '#e0e3e5'
  on-surface: '#181c1e'
  on-surface-variant: '#464652'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eef1f3'
  outline: '#777683'
  outline-variant: '#c7c5d4'
  surface-tint: '#4f54b4'
  primary: '#15157d'
  on-primary: '#ffffff'
  primary-container: '#2e3192'
  on-primary-container: '#9da1ff'
  inverse-primary: '#c0c1ff'
  secondary: '#005faf'
  on-secondary: '#ffffff'
  secondary-container: '#4f9dfd'
  on-secondary-container: '#003363'
  tertiary: '#002c40'
  on-tertiary: '#ffffff'
  tertiary-container: '#00435f'
  on-tertiary-container: '#31b4f2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#04006d'
  on-primary-fixed-variant: '#373a9b'
  secondary-fixed: '#d4e3ff'
  secondary-fixed-dim: '#a5c8ff'
  on-secondary-fixed: '#001c3a'
  on-secondary-fixed-variant: '#004785'
  tertiary-fixed: '#c6e7ff'
  tertiary-fixed-dim: '#81cfff'
  on-tertiary-fixed: '#001e2d'
  on-tertiary-fixed-variant: '#004c6b'
  background: '#f7fafc'
  on-background: '#181c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter-desktop: 24px
  margin-desktop: 32px
  gutter-mobile: 16px
  margin-mobile: 16px
  touch-target-min: 48px
---

## Brand & Style

The design system is engineered for the high-stakes environment of modern retail management. It prioritizes operational efficiency, reliability, and cognitive clarity. The brand personality is authoritative yet unobtrusive, acting as a high-performance tool rather than a decorative interface.

The design style follows a **Corporate / Modern** aesthetic with a heavy emphasis on utility. It utilizes a structured grid, clear visual hierarchies, and a utilitarian approach to density. Every element is designed to minimize friction for power users while maintaining high accessibility for frontline staff using mobile scanning devices. The interface communicates "zero-error" precision through sharp alignment and purposeful color application.

## Colors

The palette is anchored by **Enterprise Indigo** (#2E3192), used for primary navigation and core branding to establish a foundation of trust. **Commerce Blue** (#0071CE) serves as the primary action color, directing users toward "North Star" tasks like checkout or inventory confirmation.

A scale of technical grays provides the structural framework, using high-contrast text ratios (minimum 4.5:1) for all data-heavy tables. For dashboards, a supporting "Data Spectrum" is utilized, featuring high-chroma variants of the core blues to ensure multi-series charts remain legible at a glance. Backgrounds use a subtle cool-gray tint to reduce eye strain during long shifts.

## Typography

The typography system uses **IBM Plex Sans** for its exceptional legibility and systematic, corporate feel. It balances technical precision with human readability, making it ideal for both complex inventory spreadsheets and customer-facing POS screens.

For SKU numbers, barcodes, and price data, **JetBrains Mono** is employed. This monospaced choice ensures that numerical data aligns perfectly in vertical columns, allowing managers to scan for price discrepancies or stock levels without horizontal "drift" in their vision. Font weights are used sparingly but deliberately to denote hierarchy, with "Medium" (500) reserved for active UI states.

## Layout & Spacing

This design system employs a **12-column fluid grid** for desktop dashboards and a **4-column fluid grid** for mobile scanning interfaces. The spacing rhythm is based on a 4px baseline, ensuring all components scale proportionally.

On mobile, the layout shifts to a "thumb-optimized" model. Key action areas are placed in the lower 60% of the screen. We implement "Safe-Scan Margins"—generous 16px internal padding within touchable containers—to prevent accidental triggers during rapid physical movement. Desktop views maximize information density by reducing vertical padding in data tables while maintaining wide gutters between distinct functional modules.

## Elevation & Depth

Visual hierarchy is managed through **Tonal Layers** and **Low-Contrast Outlines**. This design system avoids heavy shadows to maintain a clean, high-performance look that feels native to the hardware.

- **Level 0 (Surface):** The main background using the neutral cool-gray.
- **Level 1 (Card):** White surfaces with a 1px border in a mid-tone gray (#D1D5DB). No shadow.
- **Level 2 (Overlay/Modal):** Elevated surfaces use a tight, 4px blur ambient shadow with 10% opacity to denote temporary focus.
- **Interactive Depth:** Buttons use a subtle 1px "inner highlight" on the top edge to provide a tactile feel without traditional skeuomorphism.

## Shapes

The design system adopts a **Soft** (Level 1) corner strategy. A 4px (0.25rem) radius is applied to standard inputs and buttons, providing a modern feel while retaining the structured, rectangular discipline required for a "pro" tool. 

Larger containers like dashboard cards use a 8px (0.5rem) radius to clearly encapsulate data sets. This modest roundedness ensures that even when screens are dense with information, the "containers" are distinct and the interface does not feel overly sharp or aggressive to the user.

## Components

### Buttons
Primary buttons use the Commerce Blue fill with white text. For mobile scanning interfaces, buttons must meet a minimum height of 56px to accommodate gloved hands or rapid-fire interaction.

### Inputs & Scanning Fields
Input fields feature high-contrast 1px borders that darken to Enterprise Indigo on focus. Scanning-specific inputs include a persistent "Visual Confirmation" state: a flash of the success-green border upon a valid barcode read.

### Data Tables
Tables are the heart of the system. They feature "Zebra Striping" (alternating row colors) for tracking across wide screens. Header rows are pinned and use a darker gray background with bold IBM Plex Sans labels.

### Status Chips
Status indicators (e.g., "In Stock," "Low Inventory") use high-saturation background tints with dark text. The contrast must exceed WCAG AA standards to ensure color-blind users can distinguish statuses via both hue and supporting icons.

### Mobile Scanning Target
A unique component for this system is the "Viewfinder Overlay." It uses a semi-transparent dark mask with a clear "Safe Zone" in the center, framed by high-visibility Commerce Blue corner brackets to guide the user's camera alignment.