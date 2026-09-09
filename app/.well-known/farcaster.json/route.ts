import { getPublicOrigin } from '../../../lib/server/public-origin';

export function GET(request: Request) {
  const appOrigin = getPublicOrigin(request);
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
      description:
        'Create a thesis, put an allocation behind it, and let people buy and remix it.',
      iconUrl: `${appOrigin}/riff-mark.svg`,
      splashImageUrl: `${appOrigin}/riff-mark.svg`,
      splashBackgroundColor: '#f6f6f2',
      homeUrl: appOrigin,
      primaryCategory: 'finance',
      tags: ['investing', 'stocks', 'social', 'base'],
      tagline: 'Investment ideas, built to be shared.',
    },
  });
}
