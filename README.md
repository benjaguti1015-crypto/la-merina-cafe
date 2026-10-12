# Pirata's Stamp Card

Actúa como un desarrollador Full-Stack experto. Necesito crear una aplicación web de "Tarjeta de Fidelidad Digital" minimalista y Mobile-First, utilizando React, Tailwind CSS y Supabase.

Te adjunto el logo de mi negocio. Necesito que extraigas la paleta de colores exacta de la imagen para el diseño de la aplicación.

Diseño Visual (UI/UX) de la Vista del Cliente:

Formato de Tarjeta: La interfaz principal debe ser una tarjeta central flotante con esquinas redondeadas y sombra suave. El fondo general de la app y de la tarjeta debe basarse en el color crema/beige claro del logo adjunto.

Colores y Tipografía: Usa el marrón oscuro del logo para los textos principales y bordes. Si es posible, utiliza una tipografía con estilo rústico pero legible.

Cuadrícula de 8 Sellos: La tarjeta debe mostrar exactamente 8 círculos dispuestos en una cuadrícula (ej. 2 filas de 4). Los círculos inactivos deben tener fondo crema y borde marrón oscuro. Los círculos "tachados" (activos) deben estar rellenos con el color marrón caramelo del logo.

Formato de Texto Especial: Al renderizar el nombre del cliente en la tarjeta, debes agregar obligatoriamente la palabra "Pirata: " antes del nombre. Por ejemplo, si en la base de datos el cliente se llama "Millaray Viveros", en la interfaz debe mostrarse exactamente como: Pirata: Millaray Viveros.

Requisitos de Roles y Autenticación:

Rol Administrador: Acceso mediante login seguro (email y contraseña). Es un panel de control simple donde el administrador puede: buscar clientes, registrar un nuevo cliente (ingresando solo su nombre completo) y sumar sellos a la tarjeta del cliente (de 0 a 8).

Rol Cliente (Vista Pública): Acceso sin contraseña mediante un enlace único. Solo pueden ver la tarjeta descrita anteriormente y sus sellos acumulados. No hay botones de edición en esta vista.

Estructura de Base de Datos (Supabase):

Tabla clientes (id, nombre_completo, enlace_unico).

Tabla fidelidad (id, cliente_id, sellos_actuales). La meta máxima es 8.

Aplica políticas de seguridad (RLS) para que solo el administrador pueda editar la tabla fidelidad.

Restricciones:

Mantén el código limpio, funcional y estrictamente enfocado en la tarjeta de fidelidad. No agregues páginas adicionales ni menús de navegación complejos.

[Fin del Prompt]

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://dulcesdelreypirata.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ee712592-77ff-4178-8213-5850509de60c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
