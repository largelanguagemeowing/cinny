import React from 'react';
import { Box, config } from 'folds';
import { Page, PageHero, PageHeroSection } from '../../components/page';
import PinnipedSVG from '../../../../public/res/svg/pinniped.svg';

export function WelcomePage() {
  return (
    <Page>
      <Box
        grow="Yes"
        style={{ padding: config.space.S400, paddingBottom: config.space.S700 }}
        alignItems="Center"
        justifyContent="Center"
      >
        <PageHeroSection>
          <PageHero
            icon={<img width="70" height="70" src={PinnipedSVG} alt="Pinniped Logo" />}
            title="Welcome to Pinniped"
            subTitle={<span>Yet another matrix client. v4.12.6</span>}
          />
        </PageHeroSection>
      </Box>
    </Page>
  );
}
