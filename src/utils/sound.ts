import alertSound from '../assets/alert.mp3';

export const playAlert = () => {
  const audio = new Audio(alertSound);
  audio.play().catch(() => {
    console.warn('브라우저에서 자동 재생이 차단되었습니다.');
  });
};
