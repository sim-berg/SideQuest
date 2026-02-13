import { Sheet } from 'react-modal-sheet';
import { useUIStore } from '../../stores/useUIStore';
import { useQuestStore } from '../../stores/useQuestStore';
import QuestDetail from './QuestDetail';

const snapPoints = [0, 0.35, 0.6];

export default function QuestBottomSheet() {
  const isOpen = useUIStore((s) => s.bottomSheetOpen);
  const close = useUIStore((s) => s.closeBottomSheet);
  const selectedQuest = useQuestStore((s) => s.selectedQuest);
  const selectQuest = useQuestStore((s) => s.selectQuest);
  const darkMode = useUIStore((s) => s.darkMode);

  const handleClose = () => {
    close();
    selectQuest(null);
  };

  const bg = darkMode ? '#0f172a' : '#ffffff';

  return (
    <Sheet
      isOpen={isOpen && !!selectedQuest}
      onClose={handleClose}
      snapPoints={snapPoints}
      initialSnap={2}
    >
      <Sheet.Container
        style={{
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          overflow: 'hidden',
          backgroundColor: bg,
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Sheet.Header
          style={{
            backgroundColor: bg,
          }}
        />
        <Sheet.Content
          style={{
            backgroundColor: bg,
          }}
        >
          {selectedQuest && <QuestDetail quest={selectedQuest} />}
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop onTap={handleClose} />
    </Sheet>
  );
}
