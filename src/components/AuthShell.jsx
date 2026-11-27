import GatheringGallery from './GatheringGallery';

/*
 * Frame for the log-in and sign-up pages.
 * - With `intro` (log in): the form on the left and the page title with its short description
 *   on the right, both inside one screen. On phones the title comes first, then the form.
 * - Without (sign up): the form on the left and, on wide screens, the home page's photo cards
 *   on the right (decorative).
 * One continuous page background, no divider.
 */
export default function AuthShell({ children, intro }) {
  if (intro) {
    return (
      <div className="cg-auth cg-auth-intro">
        <div className="cg-auth-head">{intro}</div>
        <div className="cg-auth-form">{children}</div>
      </div>
    );
  }
  return (
    <div className="cg-auth">
      <div className="cg-auth-form">{children}</div>
      <aside className="cg-auth-art" aria-hidden="true">
        <GatheringGallery />
      </aside>
    </div>
  );
}
