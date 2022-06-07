import React, { Component } from 'react';
import { withTaskContext } from '@twilio/flex-ui';
import ReactMarkdown from 'react-markdown';
import './styles.css'

class TranslatedMessageBody extends Component {
  constructor(props) {
    super(props);
    this.state = {}
  }
  render() {
    const { message, manager } = this.props;
    const { language } = this.props.task.attributes;
    const messageArray = message.source.body.split( ' TRANSLATEDFROM ');
    const englishMessage = message.isFromMe ? messageArray[1] : messageArray[0];
    const nonEnglishMessage = message.isFromMe ? messageArray[0] : messageArray[1];
    const skills = manager?.workerClient?.attributes?.routing?.skills || [];
    const disabledSkills = manager?.workerClient?.attributes?.disabled_skills?.skills || [];
    const skilledInLanguage = skills.includes(language) && !disabledSkills.includes(language);
    const messageDisplayed = skilledInLanguage ? nonEnglishMessage : englishMessage;
    return (
      <div style={{ marginLeft: "12px", marginRight: "12px", marginTop: "3px", marginBottom:"8px" }}>
        <ReactMarkdown>
          { messageDisplayed }
        </ReactMarkdown>
      </div>
    )
  }
}

export default withTaskContext(TranslatedMessageBody);
