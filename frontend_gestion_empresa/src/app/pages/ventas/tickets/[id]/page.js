import TicketDetalleClient from './TicketDetalleClient';

export default function TicketDetallePage({ params }) {
  return <TicketDetalleClient id={params.id} />;
}
