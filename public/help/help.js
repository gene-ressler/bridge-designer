var helpTopics = [];
var popupItems = [];

function onLoad() {
  // Scan for all topics.
  const items = document.querySelectorAll('.content-column > div');
  items.forEach(div => {
    (div.id.startsWith('glos_') ? popupItems : helpTopics).push(div);
  });
  // Decorate and add click logic to nav folders.
  for (const folder of document.getElementsByClassName('folder')) {
    setFolderListVisibility(folder);
    folder.addEventListener('click', function () {
      this.classList.toggle('open');
      setFolderListVisibility(this);
    });
  }
  decorateNavTopicItems();
  decoratePopupSpans();
  decorateTopicLinks();
  initializeDragBar();
}

/** Decorate leaf doc tree items with style and click handler. */
function decorateNavTopicItems() {
  const items = document.querySelectorAll('li[topic]');
  for (const li of items) {
    li.classList.add('item');
    li.addEventListener('click', function () {
      goToTopic(this.getAttribute('topic'));
    });
    // Set initial topic.
    if (li.getAttribute('topic') == 'hlp_whats_new') {
      li.click();
    }
  }
}

function decorateTopicLinks() {
  const items = document.querySelectorAll('span[topic]');
  items.forEach(item => {
    item.classList.add('topic-link');
    item.addEventListener('click', function () {
      goToTopic(this.getAttribute('topic'));
    });
  });
}

function decoratePopupSpans() {
  const items = document.querySelectorAll('span[popup-ref]');
  let visible;
  items.forEach(item => {
    item.classList.add('popup-link');
    // Reparent the popup div under this link and make it visible.
    item.addEventListener('click', function () {
      const popup = getPopup(this.getAttribute('popup-ref'));
      if (popup && popup !== visible) {
        popup.classList.add('popup');
        this.appendChild(popup);
        popup.style.display = 'block';
        visible = popup;
      }
    });
  });
  ['mouseup', 'keydown'].forEach(eventName => {
    const container = document.querySelector('.help-container');
    container.addEventListener(eventName, function (event) {
      // Popup is present and click is not on scrollbar.
      if (visible && event.clientX < this.clientWidth) {
        visible.style.display = 'none';
        visible = undefined;
      }
    });
  });
}

/** Makes the given folder's list visiblity consistent with folder state. */
function setFolderListVisibility(folder) {
  const folderList = folder.nextElementSibling;
  if (folderList) {
    folderList.style.display = folder.classList.contains('open') ? 'block' : 'none';
  }
}

/** Set up the boundary between nav and content for dragging with mouse. */
function initializeDragBar() {
  const dragBar = document.querySelector('.drag-bar');
  const helpContainer = document.querySelector('.help-container');
  const navColumn = document.querySelector('.nav-outline');
  let isDragging = false;

  document.addEventListener('mousedown', function (event) {
    if (event.target === dragBar && event.button === 0) {
      isDragging = true;
    }
  });

  document.addEventListener('mouseup', function (event) {
    if (event.button === 0) {
      isDragging = false;
    }
  });

  document.addEventListener('mousemove', function (event) {
    if (!isDragging) {
      return;
    }
    const xMouseHelpContainer = event.clientX - helpContainer.offsetLeft;
    // 3 is half-size of drag width not included in graphic bar.
    navColumn.style.width = Math.max(200, xMouseHelpContainer - 3) + 'px';
    navColumn.style.flexGrow = 0;
  });
}

/** Change the visible topic. */
function goToTopic(newVisibleTopic) {
  helpTopics.forEach(topic => {
    topic.style.display = topic.id === newVisibleTopic ? 'block' : 'none';
  });
}

/** Gets a popop div by id. If it's a topic, it's a cloned to preserve the topics DOM. */
function getPopup(id) {
  const popup = popupItems.find(item => item.id.replace(/_clone$/, '') === id);
  if (popup) {
    return popup;
  }
  const topic = helpTopics.find(topic => topic.id == id);
  if (topic) {
    const popupTopic = topic.cloneNode(true);
    popupTopic.id += '_clone';
    popupItems.push(popupTopic);
    return popupTopic;
  }
  return undefined;
}
