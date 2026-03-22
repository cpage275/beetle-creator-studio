// Onboarding screen management (standalone page)
import starBgUrl from './assets/star-background.png?url';
import titleImgUrl from './assets/title-img.png?url';
import creatorLogoUrl from './assets/creator-logo.png?url';
import beetleAnatomyUrl from './assets/beetle-anatomy-default.png?url';
import beetleAnatomyHoverUrl from './assets/beetle-anatomy-hover.png?url';
import angiospermUrl from './assets/angiosperm-graphic.png?url';
import nichesUrl from './assets/niches-diagram.png?url';

// ── D3 Pie Chart ──
function drawChart() {
  const wrapper = document.getElementById('onboarding-chart');
  if (!wrapper || typeof d3 === 'undefined') return;

  const dataset = [22, 18, 13, 12, 9, 8, 7, 6, 4, 1];
  const colors = ['#00FFFF', '#11FF4B', '#2BA0FF', '#CFF831', '#FF721A', '#F83BFB', '#4242FF', '#27FFA1', '#FFC812', '#9E30FF'];
    const labels = [
    'Beetles:', 'Plants/algae:', 'Other insects:', 'Other invertebrates:',
    'Flies:', 'Wasps:', 'Butterflies/moths:', 'Others:', 'Fungi:', 'Vertebrates:'
  ];
  const alwaysVisibleIndex = 0;

  const width = wrapper.offsetWidth;
  const height = wrapper.offsetHeight;
  const minOfWH = Math.min(width, height) / 2;

  const animDelay = 40;
  const animDur = 500;
  const hoverDur = 200;

  let radius = minOfWH > 155 ? 155 : minOfWH;

  let svg = d3.select('#onboarding-chart').append('svg')
    .attr({ 'width': width, 'height': height, 'class': 'pieChart' })
    .append('g')
    .attr({ 'transform': 'translate(' + width / 2 + ',' + height / 2 + ')' });

  let arc = d3.svg.arc()
    .outerRadius(radius * 0.6)
    .innerRadius(radius * 0.45);

  let outerArc = d3.svg.arc()
    .innerRadius(radius * 0.7)
    .outerRadius(radius * 0.7);

  let pie = d3.layout.pie().value(function(d) { return d; });

  let midAngle = function(d) {
    return d.startAngle + (d.endAngle - d.startAngle) / 2;
  };

  svg.append('g').attr('class', 'lines');
  svg.append('g').attr('class', 'slices');
  svg.append('g').attr('class', 'labels');

  let pieData = pie(dataset);

  // Draw slices
  svg.select('.slices')
    .selectAll('path')
    .data(pieData)
    .enter().append('path')
    .attr({ 'fill': function(d, i) { return colors[i]; }, 'd': arc })
    .style('opacity', 0)
    .transition()
    .delay(function(d, i) { return i * animDelay; })
    .duration(animDur)
    .ease('cubic-out')
    .style('opacity', function(d, i) {
      return i === alwaysVisibleIndex ? 1 : 0.25;
    });

  // Draw labels
  let textEnter = svg.select('.labels').selectAll('text')
    .data(pieData)
    .enter()
    .append('text')
    .attr({ 'dy': '0.35em' })
    .style('opacity', 0)
    .attr('transform', function(d) {
      let pos = outerArc.centroid(d);
      pos[0] = radius * 0.78 * (midAngle(d) < Math.PI ? 1 : -1);
      return 'translate(' + pos + ')';
    })
    .style('text-anchor', function(d) {
      return midAngle(d) < Math.PI ? 'start' : 'end';
    });

  textEnter.append('tspan')
    .attr('class', 'name')
    .text(function(d, i) { return labels[i] + ' '; });

  textEnter.append('tspan')
    .attr('class', 'pct')
    .style('fill', function(d, i) { return colors[i]; })
    .text(function(d, i) { return dataset[i] + '%'; });

  // Reveal always-visible label
  svg.select('.labels').selectAll('text')
    .filter(function(d, i) { return i === alwaysVisibleIndex; })
    .transition()
    .delay(dataset.length * animDelay + animDur)
    .duration(hoverDur)
    .style('opacity', 1);

  // Draw polylines
  svg.select('.lines').selectAll('polyline')
    .data(pieData)
    .enter()
    .append('polyline')
    .style('opacity', 0)
    .attr('points', function(d) {
      let pos = outerArc.centroid(d);
      pos[0] = radius * 0.75 * (midAngle(d) < Math.PI ? 1 : -1);
      return [arc.centroid(d), outerArc.centroid(d), pos];
    });

  // Reveal always-visible polyline
  svg.select('.lines').selectAll('polyline')
    .filter(function(d, i) { return i === alwaysVisibleIndex; })
    .transition()
    .delay(dataset.length * animDelay + animDur)
    .duration(hoverDur)
    .style('opacity', 0.5);

  // Hover interactions
  svg.select('.slices').selectAll('path')
    .on('mouseover', function(d, i) {
      d3.select(this).transition().duration(hoverDur).style('opacity', 1);
      svg.select('.labels').selectAll('text')
        .filter(function(td, ti) { return ti === i; })
        .transition().duration(hoverDur).style('opacity', 1);
      svg.select('.lines').selectAll('polyline')
        .filter(function(td, ti) { return ti === i; })
        .transition().duration(hoverDur).style('opacity', 0.5);
    })
    .on('mouseout', function(d, i) {
      if (i === alwaysVisibleIndex) {
        d3.select(this).transition().duration(hoverDur).style('opacity', 1);
        svg.select('.labels').selectAll('text')
          .filter(function(td, ti) { return ti === i; })
          .transition().duration(hoverDur).style('opacity', 1);
        svg.select('.lines').selectAll('polyline')
          .filter(function(td, ti) { return ti === i; })
          .transition().duration(hoverDur).style('opacity', 0.5);
      } else {
        d3.select(this).transition().duration(hoverDur).style('opacity', 0.25);
        svg.select('.labels').selectAll('text')
          .filter(function(td, ti) { return ti === i; })
          .transition().duration(hoverDur).style('opacity', 0);
        svg.select('.lines').selectAll('polyline')
          .filter(function(td, ti) { return ti === i; })
          .transition().duration(hoverDur).style('opacity', 0);
      }
    });
}

// ── Onboarding Init ──
function initOnboarding() {
  // Set background image on all screens
  const screens = document.querySelectorAll('.onboarding-screen');
  screens.forEach(screen => {
    screen.style.backgroundImage = `url(${starBgUrl})`;
  });

  // Set dynamic image sources
  const titleImg = document.getElementById('onboarding-title-img');
  if (titleImg) titleImg.src = titleImgUrl;

  const creatorLogo = document.getElementById('onboarding-creator-logo');
  if (creatorLogo) creatorLogo.src = creatorLogoUrl;

  const anatomyImg = document.getElementById('onboarding-anatomy-img');
  if (anatomyImg) {
    anatomyImg.src = beetleAnatomyUrl;
    anatomyImg.addEventListener('mouseenter', () => { anatomyImg.src = beetleAnatomyHoverUrl; });
    anatomyImg.addEventListener('mouseleave', () => { anatomyImg.src = beetleAnatomyUrl; });
  }

  const angiospermImg = document.getElementById('onboarding-angiosperm-img');
  if (angiospermImg) angiospermImg.src = angiospermUrl;

  const nichesImg = document.getElementById('onboarding-niches-img');
  if (nichesImg) nichesImg.src = nichesUrl;

  // Screen references
  const titleScreen = document.getElementById('onboarding-title');
  const quoteScreen = document.getElementById('onboarding-quote');
  const infoScreen = document.getElementById('onboarding-info');
  const createBtn = document.getElementById('onboarding-create-btn');

  // Screen 1 → Screen 2: click anywhere
  titleScreen.addEventListener('click', () => {
    titleScreen.classList.add('fade-out');
    setTimeout(() => {
      titleScreen.classList.remove('active');
      titleScreen.classList.remove('fade-out');
      quoteScreen.classList.add('active');

      // Screen 2 → Screen 3: auto-advance after 5s
      setTimeout(() => {
        quoteScreen.classList.add('fade-out');
        setTimeout(() => {
          quoteScreen.classList.remove('active');
          quoteScreen.classList.remove('fade-out');
          infoScreen.classList.add('active');
          // Draw chart once the info screen is visible
          setTimeout(drawChart, 100);
        }, 1000);
      }, 5000);
    }, 800);
  });

  // Screen 3 → Beetle creator: navigate to creator page
  createBtn.addEventListener('click', () => {
    document.body.classList.add('page-exit');
    setTimeout(() => {
      window.location.href = './index.html';
    }, 600);
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOnboarding);
} else {
  initOnboarding();
}
