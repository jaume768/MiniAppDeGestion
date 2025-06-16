import PedidoDetalleClient from './PedidoDetalleClient';

export default function PedidoDetallePage({ params }) {
  return <PedidoDetalleClient id={params.id} />;
}
