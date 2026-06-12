import type {CustomerMemoTag, PointHistoryEntry} from '../../../utils/customers';
import {POINT_HISTORY_LABELS, formatTel} from '../../../utils/customers';
import {formatPrice} from '../../../utils/services';
import {CloseIconButton} from '../../ui/CloseIconButton';
import {ColorPickerButton} from '../../ui/ColorPickerButton';
import {StyledHeader} from './ModalStyles';
import {
    StyledAddressMemoSection,
    StyledAddressMemoList,
    StyledAddressMemoItem,
    StyledTagEditor,
    StyledTagInputRow,
    StyledColorRow,
    StyledTagRemoveButton,
    StyledEditError,
    StyledEmptyText,
    StyledPointHistoryList,
    StyledPointHistoryItem,
    StyledPointHistoryTop,
    StyledPointHistoryMeta,
    StyledPointHistoryOverlay,
    StyledPointHistoryModal,
    StyledPointHistoryModalContent,
    StyledHeaderActionButton,
    StyledUnmergeOverlay,
    StyledUnmergeModal,
    StyledUnmergeContent,
    StyledUnmergeMessage,
    StyledUnmergeList,
    StyledUnmergeItem,
    StyledUnmergeFooter,
} from './CustomerDetail.styles';

export const MEMO_TAG_COLORS = ['#4285F4', '#34A853', '#EA4335', '#FBBC04', '#FF6D01', '#46BDC6', '#9334E6', '#E91E8C'];

/* ── 적립금 이력 아이템 (메인/더보기 모달 공용) ── */

export function PointHistoryItem({entry, onClick}: {entry: PointHistoryEntry; onClick: (entry: PointHistoryEntry) => void}) {
    return (
        <StyledPointHistoryItem
            $clickable={!!entry.relatedReservationId}
            onClick={() => onClick(entry)}
        >
            <StyledPointHistoryTop>
                <strong>{POINT_HISTORY_LABELS[entry.type]}</strong>
                <span>{entry.delta > 0 ? '+' : ''}{formatPrice(entry.delta)}</span>
            </StyledPointHistoryTop>
            <StyledPointHistoryMeta>
                <span>{entry.description}</span>
                <span>잔액 {formatPrice(entry.balance)}</span>
                <span>{entry.createdAt.slice(0, 16).replace('T', ' ')}</span>
            </StyledPointHistoryMeta>
        </StyledPointHistoryItem>
    );
}

/* ── 적립금 이력 더보기 모달 ── */

interface PointHistoryModalProps {
    pointHistories: PointHistoryEntry[];
    onEntryClick: (entry: PointHistoryEntry) => void;
    onClose: () => void;
}

export function CustomerPointHistoryModal({pointHistories, onEntryClick, onClose}: PointHistoryModalProps) {
    return (
        <StyledPointHistoryOverlay onClick={onClose}>
            <StyledPointHistoryModal onClick={(e) => e.stopPropagation()}>
                <StyledHeader>
                    <h3>적립금 이력 ({pointHistories.length})</h3>
                    <CloseIconButton onClick={onClose} />
                </StyledHeader>
                <StyledPointHistoryModalContent>
                    <StyledPointHistoryList>
                        {pointHistories.map((history) => (
                            <PointHistoryItem key={history.id} entry={history} onClick={onEntryClick} />
                        ))}
                    </StyledPointHistoryList>
                </StyledPointHistoryModalContent>
            </StyledPointHistoryModal>
        </StyledPointHistoryOverlay>
    );
}

/* ── 고객 메모 태그 섹션 ── */

interface MemoTagSectionProps {
    customerId: number;
    isEditing: boolean;
    tags: CustomerMemoTag[];
    newTagText: string;
    selectedTagColor: string;
    editError: string;
    onNewTagTextChange: (value: string) => void;
    onSelectTagColor: (color: string) => void;
    onAddTag: () => void;
    onRemoveTag: (text: string) => void;
}

export function CustomerMemoTagSection({
    customerId,
    isEditing,
    tags,
    newTagText,
    selectedTagColor,
    editError,
    onNewTagTextChange,
    onSelectTagColor,
    onAddTag,
    onRemoveTag,
}: MemoTagSectionProps) {
    return (
        <StyledAddressMemoSection>
            <h4>고객 메모</h4>
            {isEditing && (
                <StyledTagEditor>
                    <StyledTagInputRow>
                        <input
                            id="customer-edit-memo-tag"
                            type="text"
                            value={newTagText}
                            placeholder="메모 태그 입력"
                            onChange={(e) => onNewTagTextChange(e.target.value)}
                        />
                        <button type="button"
                                onClick={onAddTag}>추가
                        </button>
                    </StyledTagInputRow>
                    <StyledColorRow>
                        {MEMO_TAG_COLORS.map((color) => (
                            <ColorPickerButton
                                key={color}
                                type="button"
                                $selected={selectedTagColor === color}
                                $color={color}
                                $size={22}
                                onClick={() => onSelectTagColor(color)}
                            />
                        ))}
                    </StyledColorRow>
                </StyledTagEditor>
            )}
            {tags.length === 0 ? (
                <StyledEmptyText>등록된 메모가 없습니다.</StyledEmptyText>
            ) : (
                <StyledAddressMemoList>
                    {tags.map((tag) => (
                        <StyledAddressMemoItem key={`${customerId}-${tag.text}`}
                                               $color={tag.color}>
                            <span>{tag.text}</span>

                            {isEditing && (
                                <StyledTagRemoveButton type="button"
                                                       onClick={() => onRemoveTag(tag.text)}>삭제</StyledTagRemoveButton>
                            )}
                        </StyledAddressMemoItem>
                    ))}
                </StyledAddressMemoList>
            )}
            {isEditing && editError && <StyledEditError>{editError}</StyledEditError>}
        </StyledAddressMemoSection>
    );
}

/* ── 고객 병합 분리 확인 모달 ── */

export interface MergeHistorySummary {
    id: string;
    sourceName: string;
    sourceTel: string;
    mergedAt: string;
}

interface UnmergeModalProps {
    customerName: string;
    histories: MergeHistorySummary[];
    isUnmerging: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export function CustomerUnmergeModal({customerName, histories, isUnmerging, onConfirm, onClose}: UnmergeModalProps) {
    return (
        <StyledUnmergeOverlay onClick={onClose}>
            <StyledUnmergeModal onClick={(e) => e.stopPropagation()}>
                <StyledHeader>
                    <h3>고객 병합 분리</h3>
                    <CloseIconButton onClick={onClose} />
                </StyledHeader>
                <StyledUnmergeContent>
                    <StyledUnmergeMessage>
                        다음 고객이 <strong>{customerName}</strong>에 병합되었습니다. 분리하면 원래 고객이 복원됩니다.
                    </StyledUnmergeMessage>
                    <StyledUnmergeList>
                        {histories.map((h) => (
                            <StyledUnmergeItem key={h.id}>
                                <strong>{h.sourceName}</strong>
                                <span>{h.sourceTel ? formatTel(h.sourceTel) : '연락처 없음'}</span>
                                <span className="date">{h.mergedAt.slice(0, 10).replace(/-/g, '.')}</span>
                            </StyledUnmergeItem>
                        ))}
                    </StyledUnmergeList>
                </StyledUnmergeContent>
                <StyledUnmergeFooter>
                    <StyledHeaderActionButton type="button"
                                              onClick={onClose}
                                              disabled={isUnmerging}>취소</StyledHeaderActionButton>
                    <StyledHeaderActionButton type="button"
                                              $danger
                                              onClick={onConfirm}
                                              disabled={isUnmerging}>{isUnmerging ? '분리 중...' : '분리'}</StyledHeaderActionButton>
                </StyledUnmergeFooter>
            </StyledUnmergeModal>
        </StyledUnmergeOverlay>
    );
}
