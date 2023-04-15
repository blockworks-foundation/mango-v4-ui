import Button from '@components/shared/Button'
import Modal from '@components/shared/Modal'
import { useNotifications } from 'hooks/notifications/useNotifications'

const NotificationsModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) => {
  const { data } = useNotifications()
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="inline-block w-full transform overflow-x-hidden">
        <div className="flex min-h-[324px] flex-col justify-between">
          <div>
            <h2 className="text-center">Notifications</h2>
            <div className="thin-scroll mt-4 max-h-[320px] space-y-2 overflow-y-auto">
              {data?.map((notification) => (
                <div
                  className="flex h-24 w-full flex-row items-center text-th-fgd-1"
                  key={notification._id}
                >
                  <div>
                    <h5>{notification.title}</h5>
                    <div>{notification.content}</div>
                    <div>{notification.createdAt}</div>
                  </div>
                  <div className="ml-auto">
                    {!notification.seen && <Button>Mark as seen</Button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default NotificationsModal
