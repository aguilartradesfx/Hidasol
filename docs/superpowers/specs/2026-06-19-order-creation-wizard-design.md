# Diseño — Wizard de creación de órdenes + decimales + varios elementos

Fecha: 2026-06-19
Proyecto: Hidasol (Next.js 14 App Router + TypeScript + Supabase + shadcn/ui)
Alcance: formulario de **Rotulación** (`OrderForm`). Sellos y Papelería quedan fuera.

## Problema / objetivo

El usuario (administración de la imprenta) pidió tres cambios en la creación de órdenes digitales:

1. **Decimales en medidas.** Hoy no puede escribir `5.75`, `23.10`, etc.
2. **Varios trabajos en una sola orden.** Un cliente puede pedir varios trabajos que se facturan en una sola orden. Hace falta "Agregar nuevo elemento".
3. **Wizard por pasos.** Al crear una orden nueva, mostrar un bloque a la vez con barra de progreso ("Paso X de N"), botones Atrás/Siguiente, terminando en "Crear orden". No se quita nada; solo se reorganiza.

Además: dejar **backup** para poder revertir, y **desplegar en local** para revisarlo.

## Diagnóstico del bug de decimales

[order-form.tsx:651-656](../../../src/components/orders/order-form.tsx#L651-L656): los inputs de medida son
`type="number"` controlados por un valor numérico, con
`onChange={(e) => updateField('alto', parseFloat(e.target.value) || 0)}`.

En cada tecla se reconvierte a número:
- Escribir `5` y luego `.` → `parseFloat("5.")` = `5` → el punto se borra al instante.
- Escribir `23.10` → `parseFloat("23.10")` = `23.1` → el `0` final desaparece.

`step="0.1"` solo afecta a las flechas, no al tecleo. Es el clásico bug de input numérico controlado en React. Mismo patrón en valor/abono.

## Decisiones (confirmadas con el usuario)

- **Por elemento** (todo opcional): producto/descripción, cantidad, medidas, material, impresión, acabados, corpóreos. Botón **"Copiar del anterior"** para duplicar el elemento previo.
- **A nivel de orden** (compartido): cliente, facturación, fechas/estado, instalación, diseño, producción, notas.
- **Wizard a página completa**, solo al **crear**. Al **editar** se mantiene la vista actual con todas las secciones.

## Arquitectura

### Modelo de datos (`src/types/order.ts`)

Nuevo tipo `OrderElemento` con los campos de línea (todos opcionales salvo lo mínimo):

```ts
export interface OrderElemento {
  productoNombre?: string;
  productoId?: string;
  tipoTrabajo?: string;
  cantidad?: number;
  descripcion?: string;          // texto libre por elemento
  unidadMedida?: UnidadMedida;
  alto?: number;
  ancho?: number;
  materialPrincipal?: MaterialPrincipal;
  tipoMaterial?: string;
  grosorMaterial?: string;
  colorMaterial?: string;
  instalacionTipo?: string;
  bannerDetalle?: string;
  colorImpresion?: string;
  tecnica?: string;
  caras?: string;
  acabados?: Acabado[];
  corporeoTipo?: TipoCorporeo;
  corporeoMulti?: CorporeoOption[];
  corporeoColor?: string;
  corporeoFuente?: 'Si' | 'No';
  corporeoMaterial?: MaterialCorporeo;
  corporeoGrosor?: number;
  corporeoEstructura?: EstructuraCorporeo;
  colorManguera?: string;
}
```

`Order` gana `elementos?: OrderElemento[]`. Los campos planos actuales (`alto`, `ancho`, `productoNombre`, `cantidad`, `materialPrincipal`, etc.) **se conservan** y siempre reflejan `elementos[0]` (el elemento principal). Así todos los consumidores actuales y las columnas de Supabase siguen funcionando sin cambios.

Helpers nuevos en `order.ts`:
- `elementoFromOrder(order): OrderElemento` — extrae el elemento principal de los campos planos (para órdenes viejas sin `elementos`).
- `syncPrimaryElemento(order)` — copia `elementos[0]` a los campos planos antes de guardar.

### Persistencia (`src/lib/order-store.ts` + Supabase)

- Migración aditiva: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS elementos jsonb;` (nuevo archivo en `supabase/migrations/`, aplicado vía `pg` con las credenciales de `.env.local`). Cambio seguro y reversible (`DROP COLUMN`).
- `orderToRow`: agrega `elementos: order.elementos ?? null` (jsonb). Antes de mapear, `syncPrimaryElemento` garantiza que las columnas planas reflejen `elementos[0]`.
- `rowToOrder`: si `row.elementos` viene con datos, lo usa; si no, sintetiza `[elementoFromOrder(order)]`. Siempre devuelve al menos 1 elemento.
- Resiliencia: si la columna aún no existiera, el `insert`/`update` con `elementos` fallaría. Para que el deploy local funcione siempre, la migración se aplica primero. (Aun sin columna, una orden de 1 elemento se guardaría vía columnas planas; los elementos extra requieren la columna.)

### UI

**Componentes nuevos** (`src/components/orders/`):
- `DecimalInput` (en `src/components/ui/` o junto al form): input `type="text"` + `inputMode="decimal"` con estado de texto local; acepta `.`/`,`, permite estados intermedios (`5.`, `23.10`, vacío); emite `number` al padre. Reemplaza los inputs numéricos de medidas y montos. Arregla el bug (1).
- `ElementoEditor`: edita un `OrderElemento` (producto + medidas + material + impresión + acabados + corpóreos). Reutiliza `DecimalInput`.
- `ElementosSection`: lista de `ElementoEditor` en tarjetas, con **"+ Agregar elemento"**, **"Copiar del anterior"** y eliminar (no permite borrar el último). Resuelve (2).
- `WizardShell`: contenedor a pantalla completa (`fixed inset-0 z-50`) con header (título + barra de progreso `@radix-ui/react-progress` + "Paso X de N" + cerrar) y footer (Atrás / Siguiente / Crear orden). Resuelve (3).

**`OrderForm` (refactor mínimo, una sola fuente de verdad):**
- El estado (`formData`), `updateField` y los helpers se mantienen.
- El contenido de cada sección se extrae a funciones de render internas (`renderCliente()`, `renderFacturacion()`, …) que conservan los closures (sin reescribir la lógica).
- **Modo editar** (`order != null`): Dialog actual, todas las secciones (incluida `ElementosSection`).
- **Modo crear** (`order == null`): `WizardShell` mostrando una sección por paso.

**Pasos del wizard (crear):**
1. Cliente
2. Facturación
3. Datos de la orden (ID auto, fecha ingreso auto, deadline, estado=Nueva)
4. **Elementos / Trabajos** (repetible) + Instalación (nivel orden)
5. Diseño
6. Producción
7. Notas

Validación por paso: el paso 1 exige `cliente`; el resto avanza libre (campos opcionales). El botón del último paso es "Crear orden".

### Consumidores que muestran varios elementos
- [order-detail-modal.tsx](../../../src/components/orders/order-detail-modal.tsx): la sección de medidas/material itera `order.elementos` (fallback a campos planos).
- [production-ticket.tsx](../../../src/components/orders/production-ticket.tsx): el ticket lista cada elemento.
- Resto (recent-orders, search-orders, station/designer dashboards, icon-view, hierarchical-browser): sin cambios; siguen usando el producto principal (`order.productoNombre`, etc.).

## Fuera de alcance
- Sellos y Papelería.
- Dashboards/estaciones por elemento (siguen contando a nivel de orden).
- Tests automatizados (el proyecto no tiene framework de testing).

## Backup / revert
- Rama `backup/pre-wizard-ordenes` apuntando al estado actual.
- Trabajo en rama `feature/order-wizard-elementos`.
- Revertir código = volver a `main`/backup. La columna `elementos` queda como columna anulable sin uso (inofensiva) o se elimina con `DROP COLUMN`.

## Verificación
- `npx tsc --noEmit` y `npm run build` sin errores.
- `npm run dev` y prueba manual: crear orden con 2 elementos y decimales (`23.10`, `5.75`), navegar pasos con la barra, guardar, reabrir en detalle/ticket, y editar.
```
