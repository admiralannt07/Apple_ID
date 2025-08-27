document.addEventListener("DOMContentLoaded", () => {
  // scalable dropdown heights
  const dropdownHeights = {
    Mac: 540,
    iPad: 495,
    iPhone: 425,
    Watch: 425,
    AirPods: 365,
    TVHome: 325,
    Entertainment: 515,
    Support: 480,
    Store: 300,
  };

  // select the header element, all nav items and dropdown menus
  const navItems = document.querySelectorAll(".nav-item");
  const allDropdownMenus = document.querySelectorAll(".dropdown-menu");
  const dropdownBackground = document.querySelector(".nav-dropdown-background");
  const pageBlurOverlay = document.querySelector(".page-blur-overlay");
  const header = document.querySelector(".header");

  // burger menu
  const burgerMenu = document.querySelector(".burger-menu");

  // carousel setup
  const track = document.querySelector(".carousel-track");
  let items = Array.from(track.children);
  const dots = Array.from(document.querySelectorAll(".carousel-controls .item"));

  // carousel state
  const realItemsCount = items.length;
  const cloneCount = 3;
  let currentIndex = cloneCount;
  let isAnimating = false;
  let isDotStepAnimating = false;

  // burger menu logic
  burgerMenu.addEventListener("click", () => {
    // Toggle the active class on the header to trigger animations
    header.classList.toggle("mobile-menu-active");
  });

  // dropdown behavior
  navItems.forEach((item) => {
    // mouse enter, show the dropdown
    item.addEventListener("mouseenter", () => {
      const height = dropdownHeights[item.id] || 0;
      if (height > 0) {
        dropdownBackground.style.height = `${height}px`;
      }

      pageBlurOverlay.classList.add("active");

      const currentMenu = item.querySelector(".dropdown-menu");
      allDropdownMenus.forEach((menu) => {
        if (menu === currentMenu) {
          menu.classList.add("active");
        } else {
          menu.classList.remove("active");
        }
      });
    });
  });

  // mouse leave, hide the dropdown
  header.addEventListener("mouseleave", () => {
    dropdownBackground.style.height = "0px";
    allDropdownMenus.forEach((menu) => menu.classList.remove("active"));
    pageBlurOverlay.classList.remove("active");
  });

  // --- 1. SETUP CAROUSEL ---
  function setupCarousel() {
    for (let i = 0; i < cloneCount; i++) {
      const clone = items[realItemsCount - 1 - i].cloneNode(true);
      track.insertBefore(clone, track.firstChild);
    }
    for (let i = 0; i < cloneCount; i++) {
      const clone = items[i].cloneNode(true);
      track.appendChild(clone);
    }
    items = Array.from(track.children);
    setPositionByIndex(false);
  }

  // --- 2. CORE MOVEMENT & POSITIONING LOGIC ---
  function setPositionByIndex(withAnimation = true) {
    const currentItem = items[currentIndex];
    const style = window.getComputedStyle(track);
    const matrix = new DOMMatrix(style.transform);
    const currentX = matrix.m41;
    const itemRect = currentItem.getBoundingClientRect();
    const viewportCenter = window.innerWidth / 2;
    const itemCenter = itemRect.left + itemRect.width / 2;
    const newPosition = currentX - (itemCenter - viewportCenter);

    if (withAnimation) {
      track.style.transform = `translateX(${newPosition}px)`;
    } else {
      track.style.transition = "none";
      track.style.transform = `translateX(${newPosition}px)`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          track.style.transition = "";
          // **FIX PART 2**: Remove the class after the reset is complete.
          track.classList.remove("is-resetting");
        });
      });
    }
    updateClasses();
  }

  // --- 3. ANIMATION AND CLASS UPDATES ---
  function handleLoopReset() {
    // Check if the current slide is a clone
    if (currentIndex < cloneCount || currentIndex >= realItemsCount + cloneCount) {
      // **FIX PART 1**: Add the class right before the jump.
      track.classList.add("is-resetting");
      isAnimating = false; // Reset animation flag here
      if (currentIndex < cloneCount) {
        currentIndex += realItemsCount;
      } else {
        currentIndex -= realItemsCount;
      }
      setPositionByIndex(false);
    } else {
      isAnimating = false; // Reset flag for normal transitions
    }
  }

  function slide(direction) {
    if (isAnimating) return;
    isAnimating = true;
    items[currentIndex].classList.add("is-leaving");
    currentIndex += direction;
    setPositionByIndex();
    animateDot((currentIndex - cloneCount + realItemsCount) % realItemsCount);
    setTimeout(handleLoopReset, 1000);
  }

  function updateClasses() {
    const realIndex = (currentIndex - cloneCount + realItemsCount) % realItemsCount;
    items.forEach((item, index) => {
      item.classList.toggle("is-active", index === currentIndex);
      item.classList.remove("is-leaving");
    });
    if (!isDotStepAnimating) {
      dots.forEach((dot, index) => {
        dot.classList.toggle("is-active", index === realIndex);
      });
    }
  }

  function animateDot(realIndex) {
    const dot = dots[realIndex];
    if (!dot) return;
    dot.classList.add("change");
    dot.addEventListener("animationend", () => dot.classList.remove("change"), { once: true });
  }

  function animateDotsStepByStep(start, end) {
    isDotStepAnimating = true;
    const direction = end > start ? 1 : -1;
    const steps = Math.abs(end - start);
    const animMs = 900;
    const delayPerStep = animMs / steps;
    let currentStep = start;
    for (let i = 1; i <= steps; i++) {
      const nextStep = start + i * direction;
      setTimeout(() => {
        dots[currentStep].classList.remove("is-active");
        dots[nextStep].classList.add("is-active");
        animateDot(nextStep);
        currentStep = nextStep;
        if (i === steps) {
          isDotStepAnimating = false;
        }
      }, i * delayPerStep);
    }
  }

  // --- 4. EVENT LISTENERS ---
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      const realCurrentIndex = (currentIndex - cloneCount + realItemsCount) % realItemsCount;
      const targetRealIndex = index;
      if (targetRealIndex === realCurrentIndex || isAnimating) return;
      isAnimating = true;
      isDotStepAnimating = true;
      const targetItemIndex = targetRealIndex + cloneCount;
      items[currentIndex].classList.add("is-leaving");
      currentIndex = targetItemIndex;
      setPositionByIndex();
      animateDotsStepByStep(realCurrentIndex, targetRealIndex);
      setTimeout(handleLoopReset, 900);
    });
  });

  track.addEventListener("click", (event) => {
    const clickedItem = event.target.closest(".carousel-item");
    if (!clickedItem || isAnimating) return;
    const index = items.indexOf(clickedItem);
    if (index === currentIndex) return;
    if (index === currentIndex + 1) {
      slide(1);
    } else if (index === currentIndex - 1) {
      slide(-1);
    }
  });

  // --- 5. INITIALIZATION ---
  setupCarousel();
});

// after content loaded, 2nd and 3rd footnotes, the mobile copyright text, and accordion-list will not be displayed
window.addEventListener("DOMContentLoaded", () => {
  const accordionLists = document.querySelectorAll(".accordion-list");
  const secondfootnote = document.getElementById("footnote-2");
  const thirdfootnote = document.getElementById("footnote-3");
  const mobilecopyright = document.querySelector(".list-copyright-mobile");
  if (window.innerWidth > 920) {
    if (secondfootnote) secondfootnote.style.display = "none";
    if (thirdfootnote) thirdfootnote.style.display = "none";
    if (mobilecopyright) mobilecopyright.style.display = "none";
    accordionLists.forEach((list) => {
      list.style.display = "none";
    });
  }
});

// responsive events
window.addEventListener("resize", () => {
  const accordionLists = document.querySelectorAll(".accordion-list");
  const secondfootnote = document.getElementById("footnote-2");
  const thirdfootnote = document.getElementById("footnote-3");
  const mobilecopyright = document.querySelector(".list-copyright-mobile");
  const dots = document.querySelectorAll(".dot");

  // if window width is greater than 920px, hide elements
  if (window.innerWidth > 920) {
    secondfootnote.style.display = "none";
    thirdfootnote.style.display = "none";
    mobilecopyright.style.display = "none";
    accordionLists.forEach((list) => {
      list.style.display = "none";
    });
    // if window width is less than or equal to 431px, hide dots
  } else if (window.innerWidth <= 541) {
    secondfootnote.style.display = "";
    thirdfootnote.style.display = "";
    mobilecopyright.style.display = "";
    accordionLists.forEach((list) => {
      list.style.display = "";
    });
    dots.forEach((dot) => {
      dot.style.display = "none";
    });
    // if window width is less than or equal to 920px but greater than 431px
  } else {
    secondfootnote.style.display = "";
    thirdfootnote.style.display = "";
    mobilecopyright.style.display = "";
    accordionLists.forEach((list) => {
      list.style.display = "";
    });
    dots.forEach((dot) => {
      dot.style.display = "";
    });
  }
});

// accordion events
let accordion = document.getElementsByClassName("accordion");
for (let i = 0; i < accordion.length; i++) {
  accordion[i].addEventListener("click", function () {
    this.classList.toggle("active");
    let panel = this.nextElementSibling;
    if (panel.style.maxHeight) {
      accordion[i].style.borderBottom = "";
      panel.style.maxHeight = null;
    } else {
      accordion[i].style.borderBottom = "none";
      panel.style.maxHeight = panel.scrollHeight + "px";
    }
  });
}
