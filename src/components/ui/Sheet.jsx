import Modal from './Modal.jsx'

/**
 * Backwards-compatible alias of the unified <Modal>.
 * Existing call sites use <Sheet open onClose title width footer>; Modal has
 * the same API but is responsive (side panel on tablet/desktop, bottom-sheet
 * on mobile). Prefer importing Modal directly in new code.
 */
export default function Sheet(props) {
  return <Modal {...props} />
}
