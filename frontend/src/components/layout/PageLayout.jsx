/**
 * PageLayout — wraps every inner page (except Dashboard) with
 * the image.png background blended tastefully behind the content.
 *
 * Usage:
 *   <PageLayout>
 *     <div className="mx-auto max-w-5xl px-5 pb-20 pt-28 sm:px-8">
 *       ...page content...
 *     </div>
 *   </PageLayout>
 */
export function PageLayout({ children }) {
  return (
    <div className="relative min-h-screen">
      {/* Fixed decorative background — image.png */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundImage: "url('/image.png')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Dark overlay so text stays readable over the image */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-ink-950/88 dark-overlay" />
      {children}
    </div>
  );
}
