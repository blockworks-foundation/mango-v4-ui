import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import WormholeBridge from '@wormhole-foundation/wormhole-connect'

const BridgeModal = ({ isOpen, onClose }: ModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      panelClassNames="sm:max-w-xl"
      disableOutsideClose
    >
      <div className="-mb-2 rounded border border-th-bkg-2 p-4 text-th-fgd-1">
        Use Wormhole to bridge tokens from another chain to Solana, you can then
        deposit your tokens on Mango as collateral.
      </div>
      <div className="thin-scroll max-h-[800px] overflow-y-scroll">
        <WormholeBridge
          config={{
            env: 'mainnet',
            rpcs: {
              solana: 'https://mango.rpcpool.com/946ef7337da3f5b8d3e4a34e7f88',
            },
            customTheme: {
              primary: {
                '50': '#fafafa',
                '100': '#f5f5f5',
                '200': '#eeeeee',
                '300': '#e0e0e0',
                '400': '#bdbdbd',
                '500': '#9e9e9e',
                '600': '#757575',
                '700': '#616161',
                '800': '#424242',
                '900': '#212121',
                A100: '#f5f5f5',
                A200: '#eeeeee',
                A400: '#bdbdbd',
                A700: '#616161',
              },
              secondary: {
                '50': '#fafafa',
                '100': '#f5f5f5',
                '200': '#eeeeee',
                '300': '#e0e0e0',
                '400': '#bdbdbd',
                '500': '#9e9e9e',
                '600': '#757575',
                '700': '#616161',
                '800': '#424242',
                '900': '#212121',
                A100: '#f5f5f5',
                A200: '#eeeeee',
                A400: '#bdbdbd',
                A700: '#616161',
              },
              divider: '#ffffff33',
              background: { default: 'transparent' },
              text: { primary: '#ffffff', secondary: '#9e9e9e' },
              error: {
                '50': '#ffebee',
                '100': '#ffcdd2',
                '200': '#ef9a9a',
                '300': '#e57373',
                '400': '#ef5350',
                '500': '#f44336',
                '600': '#e53935',
                '700': '#d32f2f',
                '800': '#c62828',
                '900': '#b71c1c',
                A100: '#ff8a80',
                A200: '#ff5252',
                A400: '#ff1744',
                A700: '#d50000',
              },
              info: {
                '50': '#97a5b7',
                '100': '#8293a9',
                '200': '#6e819a',
                '300': '#596f8c',
                '400': '#445d7e',
                '500': '#304C70',
                '600': '#2b4464',
                '700': '#263c59',
                '800': '#21354e',
                '900': '#1c2d43',
                A100: '#304C70',
                A200: '#304C70',
                A400: '#304C70',
                A700: '#304C70',
              },
              success: {
                '50': '#66d6cd',
                '100': '#4dcfc4',
                '200': '#33c8bc',
                '300': '#1ac1b4',
                '400': '#01BBAC',
                '500': '#00a89a',
                '600': '#009589',
                '700': '#008278',
                '800': '#007067',
                '900': '#005d56',
                A100: '#00a89a',
                A200: '#00a89a',
                A400: '#00a89a',
                A700: '#00a89a',
              },
              warning: {
                '50': '#ffe3a4',
                '100': '#ffdd91',
                '200': '#ffd77f',
                '300': '#ffd26d',
                '400': '#ffcc5b',
                '500': '#FFC749',
                '600': '#e5b341',
                '700': '#cc9f3a',
                '800': '#b28b33',
                '900': '#99772b',
                A100: '#FFC749',
                A200: '#FFC749',
                A400: '#FFC749',
                A700: '#FFC749',
              },
              button: {
                primary: '#ffffff19',
                primaryText: '#ffffff',
                disabled: '#ffffff0F',
                disabledText: '#ffffff66',
                action: '#ffffff',
                actionText: '#000000',
                hover: '#ffffff0F',
              },
              options: { hover: '#ffffff0F', select: '#ffffff19' },
              card: {
                background: '#ffffff0C',
                secondary: '#ffffff0C',
                elevation: 'none',
              },
              popover: {
                background: '#1b2033',
                secondary: '#ffffff0C',
                elevation: 'none',
              },
              modal: { background: 'rgba(28, 25, 37, 1)' },
              font: {
                primary: '"Inter", sans-serif',
                header: '"IBM Plex Mono", monospace',
              },
            },
            bridgeDefaults: { fromNetwork: 'ethereum', toNetwork: 'solana' },
            showHamburgerMenu: false,
          }}
        />
      </div>
    </Modal>
  )
}

export default BridgeModal
