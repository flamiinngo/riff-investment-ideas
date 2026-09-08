const APP_ORIGIN = 'https://riff-investment-ideas.sites.openai.com';

export function GET() {
  return Response.json({
    accountAssociation: {
      header: '',
      payload: '',
      signature: '',
    },
    miniapp: {
      version: '1',
      name: 'Riff',
      subtitle: 'Buy and remix investment ideas',
      description: 'Create a thesis, put an allocation behind it, and let people buy and remix it.',
      iconUrl: `${APP_ORIGIN}/riff-mark.svg`,
      splashImageUrl: `${APP_ORIGIN}/riff-mark.svg`,
      splashBackgroundColor: '#f6f6f2',
      homeUrl: APP_ORIGIN,
      primaryCategory: 'finance',
      tags: ['investing', 'stocks', 'social', 'base'],
      tagline: 'Investment ideas, built to be shared.',
    },
  });
}
