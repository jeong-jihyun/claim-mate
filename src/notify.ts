import * as Notifications from 'expo-notifications';
import { deadlineOf } from './data/documents';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** 청구 기한(진료일+3년) 30일 전 오전 9시에 알려 준다. 실패해도 앱은 계속 동작한다. */
export async function scheduleDeadline(visitDate: string, hospital: string): Promise<string | undefined> {
  try {
    const perm = await Notifications.getPermissionsAsync();
    let granted = perm.granted;
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.granted;
    }
    if (!granted) return undefined;

    const when = deadlineOf(visitDate);
    when.setDate(when.getDate() - 30);
    when.setHours(9, 0, 0, 0);
    if (when.getTime() <= Date.now()) return undefined;

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: '보험금 청구 기한이 30일 남았어요',
        body: `${hospital} ${visitDate} 진료건을 아직 청구하지 않았다면 서둘러 주세요.`,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
    });
  } catch {
    return undefined;
  }
}

export async function cancelNotification(id?: string) {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    /* ignore */
  }
}
