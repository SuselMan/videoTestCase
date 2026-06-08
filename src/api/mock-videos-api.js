export const mockData = [
  { id: '1', filename: '2466797579047759691.MP4', title: 'Video 1' },
  { id: '2', filename: '6702137189532704568.MP4', title: 'Video 2' },
  { id: '3', filename: '7870372071727092435.MP4', title: 'Video 3' },
  { id: '4', filename: '3746059563046546718.MP4', title: 'Video 4' },
  { id: '5', filename: '6737137111559968548.MP4', title: 'Video 5' },
  { id: '6', filename: '7578542087815133230.MP4', title: 'Video 6' },
  { id: '7', filename: '3698940505591559678.MP4', title: 'Video 7' },
  { id: '8', filename: '2635594312504430960.MP4', title: 'Video 8' },
  { id: '9', filename: '6974447037748169156.MP4', title: 'Video 9' },
  { id: '10', filename: '425148686832983381.MP4', title: 'Video 10' },
  // { id: '10', filename: 'video-is-not-exist.MP4', title: 'Broken video example' },
  { id: '12', filename: '1381854028232193089.MP4', title: 'Video 11' },
];

export class MockVideosApi {
  async getVideos({ cursor = 0, limit = 5 } = {}) {
    await new Promise((resolve) => setTimeout(resolve, 200));

    // throw new Error('API error example');

    const start = Math.max(cursor, 0);
    const end = Math.min(start + limit, mockData.length);

    return {
      items: mockData.slice(start, end),
      nextCursor: end < mockData.length ? end : null,
    };
  }
}
