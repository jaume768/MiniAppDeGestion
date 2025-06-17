import AlbaranDetalleClient from './AlbaranDetalleClient';

export default async function AlbaranDetallePage({ params }) {
  const id = await params.id;
  return <AlbaranDetalleClient id={id} />;
}
