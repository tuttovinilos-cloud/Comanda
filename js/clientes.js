// ===============================
// ELIMINAR CLIENTE SEGURO
// ===============================

async function eliminarCliente(id){

  const cliente = clientes.find(c => c.id === id);
  if(!cliente) return;

  const nombre = cliente.nombre || "Cliente";

  // Contar pedidos asociados
  let pedidosAsociados = [];

  try{
    const { data } = await supabase
      .from("pedidos")
      .select("id,cliente")
      .ilike("cliente", nombre);

    pedidosAsociados = data || [];

  }catch(err){
    console.error(err);
  }

  // Si tiene pedidos NO eliminar
  if(pedidosAsociados.length > 0){

    alert(
      No puedes eliminar este cliente.\n\n +
      Tiene ${pedidosAsociados.length} pedidos asociados.\n\n +
      Primero debes fusionarlo o cambiar los pedidos a otro cliente.
    );

    return;
  }

  // Confirmación
  const confirmar = confirm(
    ¿Seguro que deseas eliminar el cliente "${nombre}"?\n\n +
    Esta acción no se puede deshacer.
  );

  if(!confirmar) return;

  try{

    // Intentar borrar real
    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", id);

    // Si falla -> ocultar
    if(error){

      console.warn("No se pudo borrar físicamente. Ocultando...", error);

      await supabase
        .from("clientes")
        .update({ activo:false })
        .eq("id", id);
    }

    clientes = clientes.filter(c => c.id !== id);

    renderClientes();

    alert("Cliente eliminado correctamente");

  }catch(err){

    console.error(err);
    alert("Error eliminando cliente");

  }
}