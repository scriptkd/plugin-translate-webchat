import React from 'react';
import { VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';

import reducers, { namespace } from './states';
import TranslatedMessageBody from './TranslatedMessageBody';

const PLUGIN_NAME = 'TranslateChatPlugin';

export default class TranslateChatPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  init(flex, manager) {
    // i really just cant deal with that second panel
    flex.AgentDesktopView.defaultProps.showPanel2 = false;
    this.registerReducers(manager);
    this.translateMessage(flex, manager);

    //replace message bodies
    flex.MessageBubble.Content.remove("body", {if: (props) => props.message?.source?.body?.includes('TRANSLATEDFROM')});
    flex.MessageBubble.Content.add(<TranslatedMessageBody key="translatedBody" manager={manager}  />, {
      if: (props) => props.message?.source?.body?.includes('TRANSLATEDFROM') });
  }

  async translateMessage(flex, manager) {
    
    // replace url with the endpoint for your translator API
    const url = 'YOUR_TRANSLATOR_API';


    const parser = ' TRANSLATEDFROM ';
    let notYetTranslated = true;
    flex.Actions.addListener("beforeSendMessage", async (payload, abortFunction) => {
      if (payload.channel.source.channelState.attributes.channel_type === 'web') {
        const skills = manager?.workerClient?.attributes?.routing?.skills || [];
        const disabledSkills = manager?.workerClient?.attributes?.disabled_skills?.skills || [];
        const customerLanguage = payload?.channel?.source?.attributes?.pre_engagement_data?.language || [];
        if ((!skills.includes(customerLanguage) || disabledSkills.includes(customerLanguage)) && notYetTranslated) {
          const { body, channelSid } = payload;
          abortFunction();
          const translate = await fetch(`${url}?text=${encodeURIComponent(body)}&to=${customerLanguage}&from=en`, { method: 'GET'} );
          const translatedMessage = await translate.json();
          notYetTranslated = false;
          flex.Actions.invokeAction("SendMessage", { channelSid, body: translatedMessage + parser + body });
          notYetTranslated = true;
        }
      }
    })
  }

  /**
   * Registers the plugin reducers
   *
   * @param manager { Flex.Manager }
   */
  registerReducers(manager) {
    if (!manager.store.addReducer) {
      // eslint: disable-next-line
      console.error(`You need FlexUI > 1.9.0 to use built-in redux; you are currently on ${VERSION}`);
      return;
    }

    manager.store.addReducer(namespace, reducers);
  }
}
