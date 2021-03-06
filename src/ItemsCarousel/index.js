import React from 'react';
import PropTypes from 'prop-types';
import { Motion, spring, presets } from 'react-motion';
import Measure from 'react-measure';
import styled from 'styled-components';
import range from 'lodash/range';
import PlaceholderCarousel from './PlaceholderCarousel';
import {
  calculateItemWidth,
  calculateItemLeftGutter,
  calculateItemRightGutter,
  calculateTranslateX,
  showLeftChevron,
  showRightChevron,
  calculateNextIndex,
  calculatePreviousIndex,
} from './helpers';

const CarouselWrapper = styled.div`
  position: relative;
`;

const Wrapper = styled.div`
  width: 100%;
  overflow-x: ${(props) => props.freeScrolling ? 'scroll' : 'hidden'};
`;

const SliderItemsWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: nowrap;
  transform: translateX(-${(props) => props.translateX}px);
`;

const SliderItem = styled.div`
  width: ${(props) => props.width}px;
  flex-shrink: 0;
  padding-right: ${(props) => props.rightGutter}px;
  padding-left: ${(props) => props.leftGutter}px;
`;

const CarouselRightChevron = styled.div`
  position: absolute;
  height: 100%;
  width: ${(props) => props.chevronWidth + 1}px;
  cursor: pointer;
  background: #FFF;
  right: -${(props) => props.outsideChevron ? props.chevronWidth + 1 : 1}px;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CarouselLeftChevron = styled(CarouselRightChevron)`
  left: -${(props) => props.outsideChevron ? props.chevronWidth + 1 : 1}px;
  right: 0px;
`;

class ItemsCarousel extends React.Component {
  componentWillMount() {
    this.setState({
      containerWidth: 0,
      isPlaceholderMode: this.props.enablePlaceholder && this.props.children.length === 0,
    });

    this.startPlaceholderMinimumTimer();
  }

  componentWillUnmount() {
    if(this.placeholderTimer) {
      clearTimeout(this.placeholderTimer);
    }
  }

  componentWillReceiveProps(nextProps) {
    // Data loaded and no timer to deactivate placeholder mode
    if(nextProps.children.length > 0 && this.props.children.length === 0 && !this.placeholderTimer) {
      this.setState({ isPlaceholderMode: false });
    }
  }

  startPlaceholderMinimumTimer = () => {
    if(! this.props.minimumPlaceholderTime) {
      return;
    }

    this.placeholderTimer = setTimeout(() => {
      this.placeholderTimer = null;
      if(this.props.children.length > 0) {
        this.setState({ isPlaceholderMode: false });
      }
    }, this.props.minimumPlaceholderTime);
  }

  getInitialFrame = ({ translateX }) => ({
    translateX,
  });

  calculateNextFrame = ({ translateX, springConfig }) => ({
    translateX: spring(translateX, springConfig),
  });

  renderList({ translateX }) {
    const {
      gutter,
      freeScrolling,
      numberOfCards,
      firstAndLastGutter,
      children,
      showSlither,
    } = this.props;

    const {
      containerWidth,
    } = this.state;

    return (
      <Measure
        whitelist={['width']}
        onMeasure={({ width }) => {
          this.setState({ containerWidth: width });
        }}
      >
        <Wrapper
          freeScrolling={freeScrolling}
        >
          <SliderItemsWrapper
            translateX={translateX}
          >
            {children.map((child, index) => (
              <SliderItem
                key={index}
                width={calculateItemWidth({
                  firstAndLastGutter,
                  containerWidth,
                  gutter,
                  numberOfCards,
                  showSlither,
                })}
                leftGutter={calculateItemLeftGutter({
                  index,
                  firstAndLastGutter,
                  gutter,
                })}
                rightGutter={calculateItemRightGutter({
                  index,
                  firstAndLastGutter,
                  gutter,
                  numberOfChildren: children.length,
                })}
              >
                {child}
              </SliderItem>
            ))}
          </SliderItemsWrapper>
        </Wrapper>
      </Measure>
    );
  }

  render() {
    const {
      gutter,
      freeScrolling,
      numberOfCards,
      firstAndLastGutter,
      children,
      activeItemIndex,
      activePosition,
      springConfig,
      showSlither,
      rightChevron,
      leftChevron,
      chevronWidth,
      outsideChevron,
      requestToChangeActive,
    } = this.props;

    const {
      containerWidth,
      isPlaceholderMode,
    } = this.state;

    if(isPlaceholderMode) {
      return <PlaceholderCarousel {...this.props} />
    }

    if(freeScrolling) {
      return this.renderList({ translateX: 0 });
    }

    const translateX = calculateTranslateX({
      activeItemIndex,
      activePosition,
      containerWidth,
      numberOfChildren: children.length,
      numberOfCards,
      gutter,
      firstAndLastGutter,
      showSlither,
    });

    const _showRightChevron = rightChevron && showRightChevron({
      activeItemIndex,
      activePosition,
      numberOfChildren: children.length,
      numberOfCards,
    });

    const _showLeftChevron = leftChevron && showLeftChevron({
      activeItemIndex,
      activePosition,
      numberOfChildren: children.length,
      numberOfCards,
    });

    return (
      <CarouselWrapper>
        <Motion
          defaultStyle={this.getInitialFrame({ translateX, springConfig })}
          style={this.calculateNextFrame({ translateX, springConfig })}
          children={({ translateX }) => this.renderList({ translateX })}
        />
        {
          _showRightChevron && 
          <CarouselRightChevron
            chevronWidth={chevronWidth}
            outsideChevron={outsideChevron}
            onClick={() => requestToChangeActive(calculateNextIndex({
              activePosition,
              activeItemIndex,
              numberOfCards,
              numberOfChildren: children.length,
            }))}
          >
            {rightChevron}
          </CarouselRightChevron>
        }
        {
          _showLeftChevron && 
          <CarouselLeftChevron
            chevronWidth={chevronWidth}
            outsideChevron={outsideChevron}
            onClick={() => requestToChangeActive(calculatePreviousIndex({
              activePosition,
              activeItemIndex,
              numberOfCards,
              numberOfChildren: children.length,
            }))}
          >
            {leftChevron}
          </CarouselLeftChevron>
        }
      </CarouselWrapper>
    );
  }
}

ItemsCarousel.propTypes = {
  /**
   * Carousel react items.
   */
  children: PropTypes.arrayOf(PropTypes.element).isRequired,

  /**
   * Number of cards to show.
   */
  numberOfCards: PropTypes.number,

  /**
   * Space between carousel items.
   */
  gutter: PropTypes.number,

  /**
   * If true a slither of next item will be showed.
   */
  showSlither: PropTypes.bool,

  /**
   * If true first item will have twice the 
   */
  firstAndLastGutter: PropTypes.bool,

  /**
   * If true, free scrolling will be enabled.
   */
  freeScrolling: PropTypes.bool,

  /**
   * Enable placeholder items while data loads
   */
  enablePlaceholder: PropTypes.bool,

  /**
   * Placeholder item. Ignored if enablePlaceholder is false.
   */
  placeholderItem: PropTypes.element,

  /**
   * Number of placeholder items. Ignored if enablePlaceholder is false.
   */
  numberOfPlaceholderItems: PropTypes.number,

  /**
   * This is called when we want to change the active item.
   * Right now we will never call this unless a left or right chevrons are clicked.
   */
  requestToChangeActive: PropTypes.func,

  /**
   * This gives you the control to change the current active item.
   * This is ignored if freeScrolling is true.
   */
  activeItemIndex: PropTypes.number,

  /**
   * The active item position.
   * This is ignored if freeScrolling is true.
   */
  activePosition: PropTypes.oneOf([
    'left',
    'center',
    'right',
  ]),

  /**
   * Right chevron element. If passed `requestToChangeActive` must be set.
   */
  rightChevron: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.string,
  ]),

  /**
   * Left chevron element. If passed `requestToChangeActive` must be set.
   */
  leftChevron: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.string,
  ]),

  /**
   * Chevron width.
   */
  chevronWidth: PropTypes.number,

  /**
   * If true the chevron will be outside the carousel.
   */
  outsideChevron: PropTypes.bool,
};

ItemsCarousel.defaultProps = {
  numberOfCards: 3,
  gutter: 0,
  firstAndLastGutter: false,
  showSlither: false,
  freeScrolling: false,
  enablePlaceholder: false,
  activeItemIndex: 0,
  activePosition: 'left',
};

export default ItemsCarousel;
