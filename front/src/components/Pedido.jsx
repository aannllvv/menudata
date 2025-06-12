import React, { useState, useEffect } from "react";
import Axios from "axios";

const ComandasCocina = () => {
  const [comandasPreparacion, setComandasPreparacion] = useState([]);
  const [comandasListas, setComandasListas] = useState([]);
  const [comandasEntregadas, setComandasEntregadas] = useState([]);
  const [isUserActive, setIsUserActive] = useState(true);

  useEffect(() => {
    const obtenerComandas = async () => {
      try {
        const response = await Axios.get("http://localhost:5001/comandas3");
        if (response.status === 200 && Array.isArray(response.data)) {
          const data = response.data;
          setComandasPreparacion(data.filter(c => c.codestadopedido === 1)); // En preparación
          setComandasListas(data.filter(c => c.codestadopedido === 2));       // Lista
          setComandasEntregadas(data.filter(c => c.codestadopedido === 4));   // Entregada
        }
      } catch (error) {
        console.error("Error al obtener comandas:", error);
      }
    };

    obtenerComandas();

    const interval = setInterval(() => {
      if (!isUserActive) obtenerComandas();
    }, 10000);
    return () => clearInterval(interval);
  }, [isUserActive]);

  useEffect(() => {
    let activityTimeout;
    const resetActivity = () => {
      setIsUserActive(true);
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => setIsUserActive(false), 30000);
    };

    window.addEventListener("mousemove", resetActivity);
    window.addEventListener("keydown", resetActivity);
    window.addEventListener("scroll", resetActivity);
    resetActivity();

    return () => {
      window.removeEventListener("mousemove", resetActivity);
      window.removeEventListener("keydown", resetActivity);
      window.removeEventListener("scroll", resetActivity);
      clearTimeout(activityTimeout);
    };
  }, []);

  const cambiarEstadoComanda = async (codDetalles, nuevoEstado) => {
    try {
      await Axios.put(`http://localhost:5001/comandas3/${codDetalles}`, {
        CodEstadoPedido: nuevoEstado,
      });

      // Recargar los datos
      const response = await Axios.get("http://localhost:5001/comandas3");
      if (response.status === 200 && Array.isArray(response.data)) {
        const data = response.data;
        setComandasPreparacion(data.filter(c => c.codestadopedido === 1));
        setComandasListas(data.filter(c => c.codestadopedido === 2));
        setComandasEntregadas(data.filter(c => c.codestadopedido === 3));
      }

    } catch (error) {
      console.error("Error al cambiar el estado de la comanda:", error);
    }
  };

  return (
    <div className="container mt-4 table-responsive">
      <h2>Comandas en Preparación</h2>
      <table className="table table-bordered mt-3">
        <thead className="table-dark">
          <tr>
            <th>Fecha</th>
            <th>Mesero</th>
            <th>Mesa</th>
            <th>Pedido</th>
            <th>Cantidad</th>
            <th>Detalles</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {comandasPreparacion.map((comanda) => (
            <tr key={comanda.coddetalles}>
              <td>
                Fecha: {comanda.fecha?.slice(0, 10)}<br />
                Hora: {comanda.hora?.slice(0, 8)}
              </td>
              <td>{comanda.nombre_empleado}</td>
              <td>{comanda.numero_mesa}</td>
              <td>{comanda.nombre_platillo}</td>
              <td>{comanda.cantidad}</td>
              <td>{comanda.detalle_platillo || 'Sin detalles'}</td>
              <td>
                <button
                  className="btn btn-success mx-2"
                  onClick={() => cambiarEstadoComanda(comanda.coddetalles, 2)}
                >
                  Marcar como Lista
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ComandasCocina;