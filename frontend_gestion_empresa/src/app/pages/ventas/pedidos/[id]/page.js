import PedidoDetalleClient from './PedidoDetalleClient';

export default async function PedidoDetallePage({ params }) {
  const id = await params.id;
  return <PedidoDetalleClient id={id} />;
}
