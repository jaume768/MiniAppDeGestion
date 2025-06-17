import TicketDetalleClient from './TicketDetalleClient';

export default async function TicketDetallePage({ params }) {
  const id = await params.id;
  return <TicketDetalleClient id={id} />;
}
