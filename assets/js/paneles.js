// Separar este cliente del JavaScript público no reemplaza los permisos del servidor.
const PanelDB = {
  async getEditores() {
    const { data, error } = await supabaseClient
      .from('cuentas')
      .select('id, name, username, email, enabled')
      .eq('role', 'editor')
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async existeUsername(username) {
    const { data, error } = await supabaseClient
      .from('cuentas')
      .select('id')
      .ilike('username', username)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  async crearEditor({ name, username, email, password }) {
    const { data, error } = await supabaseClient.functions.invoke(
      'crear-editor',
      {
        body: {
          name: name.trim(),
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password
        }
      }
    );

    if (error) {
      let mensaje = 'No pudimos conectarnos al servicio de creación.';

      if (error.context instanceof Response) {
        mensaje = 'No se pudo crear la cuenta.';
        try {
          const respuesta = await error.context.json();
          if (typeof respuesta.error === 'string') mensaje = respuesta.error;
        } catch {
          let mensaje = 'Hubo un error en la creación de la cuenta. Actualizá el listado antes de reintentar.';
        }
      }

      throw new Error(mensaje);
    }

    if (!data?.ok) {
      throw new Error('El servicio no confirmó la creación de la cuenta.');
    }

    return data;
  },

  async cambiarEstadoEditor(id, enabled) {
    const { data, error } = await supabaseClient.functions.invoke(
      'cambiar-estado-editor',
      { body: { id: Number(id), enabled } }
    );

    if (error) {
      let mensaje = 'No pudimos confirmar el cambio. Actualizá el listado.';
      if (error.context instanceof Response) {
        try {
          const respuesta = await error.context.json();
          if (typeof respuesta.error === 'string') mensaje = respuesta.error;
        } catch {
          let mensaje = 'Hubo un error en el cambio de estado. Actualizá el listado antes de reintentar.';
        }
      }
      throw new Error(mensaje);
    }

    if (!data?.ok || !data?.editor) {
      throw new Error('El servicio no confirmó el cambio de estado.');
    }

    return data.editor;
  },

  async eliminarCuenta(id, confirmacionUsuario) {
    const { data, error } = await supabaseClient.functions.invoke(
      'eliminar-editor',
      { body: { id: Number(id), confirmacionUsuario } }
    );

    if (error) {
      let mensaje = 'No pudimos confirmar la eliminación. Actualizá el listado antes de reintentar.';
      if (error.context instanceof Response) {
        try {
          const respuesta = await error.context.json();
          if (typeof respuesta.error === 'string') mensaje = respuesta.error;
        } catch {
        let mensaje = 'Hubo un error en la eliminación. Actualizá el listado antes de reintentar.';
        }
      }
      throw new Error(mensaje);
    }

    if (!data?.ok || data.id !== Number(id)) {
      throw new Error('El servicio no confirmó la eliminación. Actualizá el listado.');
    }

    return data;
  }
};
