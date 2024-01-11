import useProfileDetails from 'hooks/useProfileDetails'
import ProfileIcon from '../icons/ProfileIcon'

const ProfileImage = ({
  imageSize,
  placeholderSize,
  imageUrl,
  isOwnerProfile,
}: {
  imageSize: string
  placeholderSize: string
  imageUrl?: string | null
  isOwnerProfile?: boolean
}) => {
  const { data: profile } = useProfileDetails()

  return imageUrl || (isOwnerProfile && profile?.profile_image_url) ? (
    <img
      alt=""
      src={imageUrl ? imageUrl : profile?.profile_image_url}
      className={`rounded-full`}
      style={{ width: `${imageSize}px`, height: `${imageSize}px` }}
    />
  ) : (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-th-bkg-3`}
      style={{ width: `${imageSize}px`, height: `${imageSize}px` }}
    >
      <div
        style={{
          width: `${placeholderSize}px`,
          height: `${placeholderSize}px`,
        }}
      >
        <ProfileIcon className={`h-full w-full text-th-fgd-3`} />
      </div>
    </div>
  )
}

export default ProfileImage
