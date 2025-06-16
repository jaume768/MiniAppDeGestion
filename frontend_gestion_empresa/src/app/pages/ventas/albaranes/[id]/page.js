import AlbaranDetalleClient from './AlbaranDetalleClient';

export default function AlbaranDetallePage({ params }) {
  return <AlbaranDetalleClient id={params.id} />;
}
