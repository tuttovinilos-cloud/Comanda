// ===============================
// ELIMINAR CLIENTE SEGURO
// ===============================

async function eliminarCliente(id){

  const cliente = clientes.find(c => c.id === id);
  if(!cliente) return;

  const nombre = cliente.nombre || "Cliente";

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

  if(pedidosAsociados.length > 0){

    alert(
      `No puedes eliminar este cliente.\n\n` +
      `Tiene ${pedidosAsociados.length} pedidos asociados.\n\n` +
      `Primero debes fusionarlo o cambiar los pedidos a otro cliente.`
    );

    return;
  }

  const confirmar = confirm(
    `¿Seguro que deseas eliminar el cliente "${nombre}"?\n\n` +
    `Esta acción no se puede deshacer.`
  );

  if(!confirmar) return;

  try{

    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", id);

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