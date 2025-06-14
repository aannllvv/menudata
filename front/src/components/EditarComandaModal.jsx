import React, { useEffect, useState } from "react";
import Select from "react-select";
import Axios from "axios";
import Swal from "sweetalert2";

const EditarComandaModal = ({ isOpen, closeModal, codPedido, actualizarPedidos }) => {
  const [meseroOptions, setMeseroOptions] = useState([]);
  const [mesaOptions, setMesaOptions] = useState([]);
  const [selectedMesero, setSelectedMesero] = useState(null);
  const [selectedMesa, setSelectedMesa] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [menuOptions, setMenuOptions] = useState([]);
  const [nuevoPlatillo, setNuevoPlatillo] = useState(null);
  const [nuevaCantidad, setNuevaCantidad] = useState(1);
  const [nuevoDetalle, setNuevoDetalle] = useState("");

  useEffect(() => {
  console.log("Modal abierto. codPedido:", codPedido);
  if (isOpen && codPedido) {
    cargarDatosIniciales();
  }
}, [isOpen, codPedido]);

  const cargarDatosIniciales = async () => {
  try {
    const [resPedido, resMeseros, resMesas, resMenu] = await Promise.all([
      Axios.get(`http://localhost:5001/pedido/${codPedido}`),
      Axios.get("http://localhost:5001/meseros"),
      Axios.get("http://localhost:5001/mesa"),
      Axios.get("http://localhost:5001/menu")
    ]);

    console.log("Pedido:", resPedido.data);
    console.log("Meseros:", resMeseros.data);
    console.log("Mesas:", resMesas.data);
    console.log("Menú:", resMenu.data);

    setMeseroOptions(resMeseros.data.map(m => ({ value: m.CodUsuario, label: m.Nombre })));
    setMesaOptions(resMesas.data.map(m => ({ value: m.CodMesa, label: m.Numero })));
    setMenuOptions(resMenu.data.map(p => ({ value: p.CodPlatillo, label: p.Nombre })));
    setDetalles(resPedido.data.detalles);

    const pedido = resPedido.data.pedido;

    setSelectedMesero({ value: pedido.codusuario, label: pedido.nombre_empleado });
    setSelectedMesa({ value: pedido.codmesa, label: pedido.numero_mesa });

  } catch (error) {
    console.error("Error al cargar datos del pedido:", error);
    Swal.fire("Error", "No se pudo cargar la información del pedido", "error");
  }
};

  const agregarNuevoDetalle = () => {
    if (!nuevoPlatillo || nuevaCantidad < 1) return;
    setDetalles([...detalles, {
      CodPlatillo: nuevoPlatillo.value,
      nombre_plato: nuevoPlatillo.label,
      Cantidad: nuevaCantidad,
      Detalles: nuevoDetalle
    }]);
    setNuevoPlatillo(null);
    setNuevaCantidad(1);
    setNuevoDetalle("");
  };

  const guardarCambios = async () => {
  try {
    for (const detalle of detalles) {
      if (!detalle.CodDetalles) {
        // Nuevo detalle → POST
        await Axios.post("http://localhost:5001/detalle", {
          CodPedido: codPedido,
          CodPlatillo: detalle.CodPlatillo,
          Cantidad: detalle.Cantidad,
          Detalles: detalle.Detalles || "Sin observaciones",
          CodEstadoPedido: 1
        });
      } else {
        // Detalle existente → PUT
        await Axios.put(`http://localhost:5001/detalle/${detalle.CodDetalles}`, {
          Cantidad: detalle.Cantidad,
          Detalles: detalle.Detalles || "Sin observaciones"
        });
      }
    }

    Swal.fire("Éxito", "Cambios guardados", "success");
    actualizarPedidos();
    closeModal();
  } catch (error) {
    console.error("Error al guardar cambios:", error);
    Swal.fire("Error", "No se pudieron guardar los cambios", "error");
  }
};

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop d-flex align-items-center justify-content-center">
    <div
        className="modal-content bg-white p-4 rounded shadow-lg d-flex flex-column"
        style={{ width: "90%", maxWidth: "800px", maxHeight: "90vh", overflow: "hidden" }}
    >
        <h3 className="text-primary mb-4">Editar Comanda</h3>

        <div className="row mb-3">
        <div className="col-md-6">
            <label className="form-label fw-bold">Mesero</label>
            <Select options={meseroOptions} value={selectedMesero} onChange={setSelectedMesero} />
        </div>
        <div className="col-md-6">
            <label className="form-label fw-bold">Mesa</label>
            <Select options={mesaOptions} value={selectedMesa} onChange={setSelectedMesa} />
        </div>
        </div>

        <h5 className="fw-bold">Detalles</h5>
        {/* CONTENEDOR SCROLLABLE */}
        <div style={{ overflowY: "auto", maxHeight: "300px", marginBottom: "1rem" }}>
        <ul className="list-group">
            {detalles.map((d, i) => (
            <li key={i} className="list-group-item d-flex align-items-center justify-content-between">
                <div className="w-100 me-3">
                <div><strong>{d.nombre_plato || d.CodPlatillo}</strong></div>
                <div className="text-muted">Cantidad: {d.Cantidad ?? d.cantidad}</div>
                <div className="text-muted">Detalle: {d.Detalles || d.detalles || "Sin observaciones"}</div>
                </div>
                <button
                className="btn btn-danger btn-sm"
                onClick={() => {
                    const nueva = detalles.filter((_, idx) => idx !== i);
                    setDetalles(nueva);
                }}
                >
                Eliminar
                </button>
            </li>
            ))}
        </ul>
        </div>

        <div className="row mb-3">
        <div className="col-md-4">
            <Select options={menuOptions} value={nuevoPlatillo} onChange={setNuevoPlatillo} placeholder="Platillo" />
        </div>
        <div className="col-md-2">
            <input type="number" className="form-control" min="1" value={nuevaCantidad} onChange={(e) => setNuevaCantidad(Number(e.target.value))} />
        </div>
        <div className="col-md-4">
            <input type="text" className="form-control" placeholder="Detalle" value={nuevoDetalle} onChange={(e) => setNuevoDetalle(e.target.value)} />
        </div>
        <div className="col-md-2 d-grid">
            <button className="btn btn-success" onClick={agregarNuevoDetalle}>Agregar</button>
        </div>
        </div>

        <div className="d-flex justify-content-end mt-auto">
        <button className="btn btn-secondary me-2" onClick={closeModal}>Cancelar</button>
        <button className="btn btn-primary" onClick={guardarCambios}>Guardar Cambios</button>
        </div>
    </div>
    </div>
  );
};

export default EditarComandaModal;