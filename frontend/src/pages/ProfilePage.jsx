import ProfilePasswordForm from '../components/ProfilePasswordForm.jsx'

export default function ProfilePage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="font-display-sm font-bold text-on-surface">Profile</h1>
      </div>
      <section className="page-section">
        <ProfilePasswordForm />
      </section>
    </>
  )
}
