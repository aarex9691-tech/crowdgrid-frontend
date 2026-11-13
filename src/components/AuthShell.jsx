import GatheringGallery from './GatheringGallery';

/*
 * Frame for the log-in and sign-up pages: the form in the middle of the left half and, on wide
 * screens, the same photo cards as the home page on the right.
 * One continuous page background, no divider. The art is decorative; the form is the page.
 */
export default function AuthShell({ children }) {
  return (
    <div className="cg-auth">
      <div className="cg-auth-form">{children}</div>
      <aside className="cg-auth-art" aria-hidden="true">
        <GatheringGallery />
      </aside>
    </div>
  );
}
