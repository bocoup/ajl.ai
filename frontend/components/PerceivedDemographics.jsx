import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';

import strToId from '../utils/str-to-id';
import valuesChanged from '../utils/values-changed';

import * as propShapes from '../prop-shapes';

import PerceivedDemographicQuestion from './PerceivedDemographicQuestion';
import ProgressBar from './ProgressBar';
import ProportionalContainer from './ProportionalContainer';
import ProgressFeedbackContainer from './ProgressFeedback/ProgressFeedback';

import styles from './PerceivedDemographics.styl';

class PerceivedDemographics extends Component {

  constructor(props) {
    super(props);

    this.state = {
      currentStep: 0,
      showFlagUI: false,
      collectDemographics: false,
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleFlag = this.handleFlag.bind(this);
    this.prevStep = this.prevStep.bind(this);
    this.openFlagUI = this.openFlagUI.bind(this);
    this.closeFlagUI = this.closeFlagUI.bind(this);
    this.handleSelfDescription = this.handleSelfDescription.bind(this);
  }

  componentDidMount() {
    this.props.onEnter();
  }

  componentWillReceiveProps(nextProps) {
    // If the questions (or the image to which they apply) change, reset our state object
    if (valuesChanged(this.props, nextProps, ['questionOrder', 'image'])) {
      // TODO: This will break if a question with the name "currentStep" is passed in;
      // this state logic might be good to eventually migrate to the Redux store
      this.setState(nextProps.questionOrder.reduce((nextState, question) => ({
        ...nextState,
        [question]: '',
      }), {
        currentStep: 0,
        showFlagUI: true,
      }));
    }
  }

  // Prepare the annotations into the format expected by the action/reducer
  prepareAnnotationsObject() {
    const annotations = this.props.questionOrder.map(questionName => ({
      name: questionName,
      value: this.state[questionName],
    }));
    return {
      id: this.props.image.id,
      annotations,
    };
  }

  handleInputChange(event) {
    const target = event.target;
    const value = (target.type === 'checkbox') ? target.checked : target.value;
    const name = target.name;

    this.setState(({ currentStep }, { questionOrder }) => {
      const nextStep = currentStep + 1;
      const maxStep = questionOrder.length;
      return {
        // Persist value
        [name]: value,
        // Auto-advance to the next step, preventing out-of-bounds values
        currentStep: nextStep > maxStep ? maxStep : nextStep,
      };
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.onSubmit(this.prepareAnnotationsObject());

    if (this.props.current >= this.props.total) {
      if (this.props.workloadCount < 1) {
        this.setState({
          collectDemographics: true,
        });
      }
      this.props.onCompleteWorkload();
    }
  }

  handleSelfDescription(event) {
    event.preventDefault();
    const contribute = event.target.className.indexOf('contribute');
    if (contribute) {
      const demographics = {
        age: document.querySelector('.annotatorAge').value,
        gender: document.querySelector('.annotatorGender').value,
        ethnicity: document.querySelector('.annotatorEthnicity').value,
        country: document.querySelector('.annotatorCountry').value,
      };
      this.props.onAnnotatorDemographics(demographics);
    }

    this.setState({
      collectDemographics: false,
    });
  }


  handleFlag(event) {
    event.preventDefault();
    const value = event.target.value;
    const { demographicAttributes, onFlag } = this.props;
    const flagAttribute = demographicAttributes[this.props.flagAttribute];
    onFlag({
      id: this.props.image.id,
      annotations: [{
        name: flagAttribute.name,
        value,
      }],
    });
    if (this.props.current >= this.props.total) {
      if (this.props.workloadCount < 1) {
        this.setState({
          collectDemographics: true,
        });
      }
      this.props.onCompleteWorkload();
    }
  }

  openFlagUI() {
    this.setState({
      showFlagUI: true,
    });
  }

  closeFlagUI() {
    this.setState({
      showFlagUI: false,
    });
  }

  prevStep() {
    // pull currentStep out of this.state to compute prev step
    this.setState(({ currentStep }) => {
      const prevStep = currentStep - 1;
      return {
        // Prevent out-of-bounds prevStep value
        currentStep: prevStep <= 0 ? 0 : prevStep,
      };
    });
  }

  render() {
    const { currentStep, showFlagUI, collectDemographics } = this.state;
    const {
      demographicAttributes,
      questionOrder,
      current: currentImage,
      total: totalImages,
    } = this.props;
    const flagAttribute = demographicAttributes[this.props.flagAttribute];
    return (
      <div>
        <ProgressFeedbackContainer show={currentStep === 0} />
        <div className={styles.wrapper}>
          {! collectDemographics ? (
            <div className={styles.mainContainer}>
              <div className={styles.imageContainer}>
                <div className={styles.progressBarContainer}>
                  <ProgressBar
                    className={styles.progressBar}
                    incrementName="Image"
                    current={currentImage}
                    total={totalImages}
                  />
                </div>
                <ProportionalContainer maxWidth="500px" widthHeightRatio={1}>
                  <img
                    src={this.props.image && this.props.image.url}
                    alt="A face to label with perceived demographic information"
                  />
                </ProportionalContainer>
              </div>

              <div className={styles.questionsContainer}>
                {flagAttribute && showFlagUI ? (
                  <fieldset role="alert" className={styles.fieldset}>
                    <h4 className={styles.PerceivedDemographicTitle}>
                      {flagAttribute.name}
                    </h4>
                    <button
                      type="button"
                      onClick={this.closeFlagUI}
                      className={styles.skipFlagButton}
                    >
                      Good Image
                    </button>
                    {flagAttribute.options.map(option => (
                      <button
                        key={`flag-${option}`}
                        className={styles.flagButton}
                        type="button"
                        value={option}
                        onClick={this.handleFlag}
                      >
                        {option}
                      </button>
                    ))}
                  </fieldset>
                ) : null}
                <form
                  onSubmit={this.handleSubmit}
                  className={classNames({
                    [styles.hidden]: showFlagUI,
                  })}
                >
                  {currentStep !== 0 ? (
                    <button
                      className={styles.prev}
                      type="button"
                      onClick={this.prevStep}
                    >◀</button>
                  ) : null}
                  {questionOrder.map((questionName, idx) => {
                    const { id, name, type, options } = demographicAttributes[questionName];
                    return (
                      <PerceivedDemographicQuestion
                        key={`question_${strToId(name)}_${id}`}
                        className={currentStep !== idx ? styles.hidden : ''}
                        name={name}
                        annotationType={type}
                        options={options}
                        selected={this.state[name]}
                        onChange={this.handleInputChange}
                      >
                        <h4 className={styles.PerceivedDemographicTitle}>
                          {name}
                        </h4>

                      </PerceivedDemographicQuestion>
                    );
                  })}
                  {currentStep >= questionOrder.length ? (
                    <div className={styles.reviewAnnotations} role="alert">
                      <h4 className={styles.PerceivedDemographicTitle}>Review Your Tags</h4>
                      <ul>{questionOrder.map((questionName) => {
                        const { name } = demographicAttributes[questionName];
                        const value = this.state[name];
                        return (
                          <li key={`confirmation_${name}`}>
                            {name}: <strong>{value}</strong>
                          </li>
                        );
                      })}</ul>

                      <div className={styles.summaryContainer}>
                        <p>
                          <strong>{currentImage}/
                          {totalImages} images</strong> labeled in set!
                        </p>
                        <p>

                          <strong>
                            {this.props.workloadCount}
                          </strong> {this.props.workloadCount === 1 ?
                             'set' : 'sets' } completed!

                        </p>
                        <p>
                          {currentImage < totalImages ? `Finish
                            this set to submit these tags.` : ''}
                        </p>
                      </div>
                      <button
                        className={classNames(styles.save, {
                          [styles.hidden]: currentStep < questionOrder.length,
                        })}
                        type="submit"
                      >{currentImage < totalImages ?
                         'Next Face' : 'Submit Tags'}</button>
                    </div>
                  ) : null}
                </form>
              </div>
            </div>
          ) :
            <form
              className={styles.reviewAnnotations}
              onSubmit={this.handleSelfDescription}
            >
              <h4 className={styles.PerceivedDemographicTitle}>
                Share Your Demographics
              </h4>

              <label htmlFor="age">Age</label>
              <input id="age" className="annotatorAge" type="text" />

              <label htmlFor="gender">Gender</label>
              <input id="gender" className="annotatorGender" type="text" />

              <label htmlFor="ethnicity">Ethnicity</label>
              <input id="ethnicity" className="annotatorEthnicity" type="text" />

              <label htmlFor="country">Country of Residence</label>
              <input id="country" className="annotatorCountry" type="text" />
              <button
                type="button"
                onClick={this.handleSelfDescription}
                className={styles.contribute}
              >
                Contribute
              </button>
              <button
                type="button"
                onClick={this.handleSelfDescription}
                className={styles.optOut}
              >
                Opt Out
              </button>
            </form>
         }
        </div>
      </div>
    );
  }
}

PerceivedDemographics.propTypes = {
  onEnter: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onFlag: PropTypes.func.isRequired,
  onCompleteWorkload: PropTypes.func.isRequired,
  onAnnotatorDemographics: PropTypes.func.isRequired,
  demographicAttributes: PropTypes.objectOf(propShapes.demographicQuestion).isRequired,
  flagAttribute: PropTypes.string.isRequired,
  questionOrder: propShapes.demographicsQuestionList.isRequired,
  image: propShapes.workloadItem,
  current: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  workloadCount: PropTypes.number.isRequired,

};

PerceivedDemographics.defaultProps = {
  image: null,
};

export default PerceivedDemographics;
