// For static export builds: generates placeholder HTML
// For dev/prod: ignored (dynamic params work normally)
export function generateStaticParams() {
  return [{ code: 'PLACEHOLDER' }];
}

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
