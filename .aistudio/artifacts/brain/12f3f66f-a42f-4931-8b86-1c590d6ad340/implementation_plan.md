# Brasa & Lúpulo: Plataforma Integral de Delivery, Repartidores y Administración

Plataforma unificada para clientes, repartidores y administradores de **Brasa & Lúpulo** (Tacuarembó). Conecta la tienda online con una aplicación web progresiva y responsive (móvil y PC) para empleados y repartidores con bloqueo exclusivo de pedidos y verificación de entrega con código secreto, más un panel de administración con control total del menú, promociones, aprobación de personal y liquidación de comisiones.

## Decisiones Críticas y Confirmaciones de Usuario

> [!IMPORTANT]
> - **Acceso Unificado Multi-Rol**: La aplicación de personal y administración está integrada directamente en la plataforma mediante acceso en cabecera y botón flotante de acceso rápido, accesible tanto en smartphones como en PC sin requerir descargas externas.
> - **Cuenta Maestra de Administrador**: Usuario inicial `Calix` con contraseña `calixdev`, con acceso instantáneo a todas las funciones directivas.
> - **Aprobación de Cuentas de Empleados**: Los nuevos registros de repartidores o camareros quedan en estado `pendiente` hasta que el Administrador los aprueba desde el panel.
> - **Bloqueo Exclusivo de Pedidos**: Al aceptar un pedido, este se asigna de manera exclusiva al repartidor/mozo, impidiendo que otros empleados lo tomen en simultáneo.
> - **Código Secreto de Verificación**: Para pedidos de Delivery, el cliente recibe un código único de 4 dígitos. El repartidor debe introducir este código en la app para validar la entrega. Para pedidos en mesa, la entrega se confirma directamente con un clic sin necesidad de código.
> - **Liquidación de Comisiones Personalizable**: Tarifa fija por entrega configurable individualmente por empleado (por defecto $60 $U, modificable por el administrador) con cálculo automático diario, semanal y mensual.
> - **Alertas Sonoras y Visuales**: Timbre y notificación sonora en tiempo real al ingresar nuevas órdenes en cocina y repartos.

---

## 1. Visión General del Sistema y Roles

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ECOSISTEMA BRASA & LÚPULO                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  PORTAL CLIENTE  │      │ APP REPARTIDORES │      │   PANEL ADMIN    │
│  (Web & Móvil)   │      │   & EMPLEADOS    │      │  (Clave Maestra) │
├──────────────────┤      ├──────────────────┤      ├──────────────────┤
│• Menú Interactivo│      │• Login / Registro│      │• Usuario 'Calix' │
│• Carrito & Pedido│      │• Espera Aprobación│     │• Aprobación Staff│
│• Delivery/Mesa/QR│      │• Lista de Pedidos│      │• Sueldos/Comisión│
│• Código Secreto  │      │• Bloqueo de Orden│      │• CMS Menú/Precios│
│• Tracker en Vivo │      │• Validación Pin  │      │• CMS Promociones │
└────────┬─────────┘      └────────┬─────────┘      └────────┬─────────┘
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    BACKEND EXPRESS + BASE DE DATOS                     │
│   (/api/orders, /api/auth, /api/staff, /api/menu, /api/promos, db.json) │
└────────────────────────────────────────────────────────────────────────┘
```

### Roles y Permisos

1. **Cliente Final**:
   - Navega la carta, diseña burgers personalizadas y pide por Delivery, Takeaway o Mesa.
   - Si pide Delivery, recibe su **código de verificación único** (ej. `4921`) que debe mostrar al repartidor al recibir la comida.
   - Puede monitorear el estado de su pedido en tiempo real.

2. **Repartidor / Empleado**:
   - Inicia sesión con su usuario y contraseña aprobados.
   - Si es nuevo, ve su pantalla de estado *"Esperando aprobación del Administrador"*.
   - Ve pedidos disponibles (Delivery, En Mesa o Para Llevar).
   - Toma un pedido disponible: la orden queda **bloqueada** exclusivamente a su nombre con fecha y hora.
   - Ve datos completos del cliente: nombre, teléfono, dirección con enlace directo a Google Maps, notas de cocina.
   - **Entrega de Delivery**: Pide al cliente su código de 4 dígitos, lo ingresa en el campo y confirma la entrega.
   - **Entrega en Mesa**: Confirma la entrega con un solo toque indicando el número de mesa.
   - Ve sus ganancias acumuladas del día y pedidos completados.

3. **Administrador (`Calix` / `calixdev`)**:
   - **Panel de Pedidos General**: Filtra por pendientes, en cocina, en camino, entregados y cancelados.
   - **Control de Personal & Nómina**:
     - Aprueba o suspende empleados registrados.
     - Asigna la comisión o tarifa por entrega individual para cada repartidor (ej. $60 $U, $80 $U).
     - Ve estadísticas por empleado: entregas en el día, semana, mes y acumulado histórico.
     - Calcula el monto a pagar a cada empleado hoy según sus entregas completadas.
   - **Gestor de Menú (CMS)**: Agrega nuevos platos, edita precios, nombres, descripciones, categorías e ingredientes.
   - **Gestor de Promociones**: Modifica banners, ofertas 2x1, combos y activa/desactiva promociones.
   - **Caja & Balance General**: Visualiza ingresos brutos de ventas, egresos por comisiones de reparto y margen neto.

---

## 2. Experiencia de Usuario y Diseño Visual

### Identidad Visual & Ergonomía
- **Tema**: Acabado oscuro industrial de cervecería artesanal con brasas al rojo vivo (`#ea580c`), ámbar de cerveza artesanal (`#f59e0b`), y superficies de hierro fundido (`#1c1917` y `#0c0a09`).
- **Navegación Móvil y Táctil**:
  - En smartphones Android, la interfaz de empleados y repartidores funciona como una aplicación nativa táctil con barra de navegación inferior fijada, botones con área mínima de contacto de 48px y tarjetas desplegables de un toque.
  - En computadoras de escritorio, se expande a un panel de control con columnas organizadas sin desaprovechar espacio.
- **Micro-interacciones y Sonido**:
  - Campana de aviso sonoro y toast visual cada vez que entra un pedido nuevo.
  - Sonido de confirmación al validar exitosamente el código de entrega.

---

## 3. Decisiones de Producto y Arquitectura de Datos

### A. Mecanismo de Bloqueo Exclusivo de Pedidos (Concurrency Lock)
- **Problema**: Dos repartidores podrían intentar tomar el mismo pedido al mismo tiempo.
- **Solución**: La ruta `POST /api/orders/:id/claim` verifica atómicamente si `order.assignedTo` ya está ocupado. Si está libre, asigna el `employeeId` y bloquea la orden, emitiendo una respuesta exitosa. Si ya fue tomado, devuelve un error 409 (*"Este pedido ya fue tomado por otro repartidor"*), actualizando la lista de todos los empleados de forma inmediata.

### B. Validación de Código de Verificación
- Cada pedido de tipo `delivery` genera un código numérico aleatorio de 4 dígitos (`verificationCode`, ej: `"8392"`).
- Este código se le muestra al cliente en su pantalla de seguimiento de pedido.
- Para cambiar el estado de la orden a `delivered`, el backend valida en `POST /api/orders/:id/deliver` que el código ingresado por el repartidor coincida exactamente con el guardado en la comanda.
- Si la orden es de tipo `table` o `takeaway`, la verificación no exige código para no demorar la atención en el salón.

### C. Estructura de Datos en Base de Datos (`/data/db.json`)
- `employees`:
  ```json
  {
    "id": "emp-calix",
    "username": "Calix",
    "password": "calixdev",
    "role": "admin",
    "status": "approved",
    "commissionPerDelivery": 60,
    "createdAt": "2026-11-05T00:00:00Z"
  }
  ```
- `orders` (expandido con control de repartidor y código):
  ```json
  {
    "id": "ORD-7821",
    "orderNumber": "#7821",
    "type": "delivery",
    "verificationCode": "4921",
    "assignedTo": "emp-102",
    "assignedToName": "Gonzalo Méndez",
    "claimedAt": "2026-11-05T19:40:00Z",
    "deliveredAt": null,
    "status": "in_transit",
    "deliveryCommission": 60
  }
  ```

---

## 4. Plan de Implementación por Fases

1. **Backend y Endpoints de Autenticación & Control**:
   - `POST /api/auth/login`: Validación de credenciales para admin y empleados.
   - `POST /api/auth/register`: Registro de nuevos empleados en estado `pending`.
   - `GET /api/staff/employees`: Listado de empleados con estadísticas de entregas y comisiones calculadas.
   - `PATCH /api/staff/employees/:id`: Aprobación, suspensión o cambio de tarifa por entrega.
   - `POST /api/orders/:id/claim`: Asignación y bloqueo exclusivo de comanda para repartidor.
   - `POST /api/orders/:id/deliver`: Verificación del código secreto del cliente y confirmación de entrega.
   - Rutas CRUD para gestión completa del menú y promociones desde el panel de administración.

2. **Componentes Frontend**:
   - `AuthModal.tsx`: Pantalla de inicio de sesión y registro de empleados/admin con selector de vista.
   - `DeliveryApp.tsx`: App dedicada para repartidores con vista de pedidos disponibles, mis entregas activas, mapa del cliente, teclado para código de verificación e historial de ganancias del día.
   - `AdminPanel.tsx`: Panel administrativo completo con pestañas para Comandas, Edición de Menú, Promociones, Gestión de Empleados y Liquidación de Sueldos.
   - Integración en `Header.tsx` y botón flotante de acceso multi-rol en la web pública de Brasa & Lúpulo.

3. **Verificación y Pruebas**:
   - Pruebas de inicio de sesión con usuario `Calix` y clave `calixdev`.
   - Simulación de registro de un nuevo repartidor y aprobación desde el panel del administrador.
   - Ciclo completo de pedido con código secreto: Creación del pedido ➔ Repartidor toma el pedido ➔ Repartidor ingresa código del cliente ➔ Validación exitosa y registro de ganancia del repartidor.
