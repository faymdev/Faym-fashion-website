// mobile nav toggle + year
document.addEventListener('DOMContentLoaded', function(){
  const hamb = document.getElementById('hamburger');
  const nav = document.getElementById('mainNav');

  hamb.addEventListener('click', function(){
    const expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', !expanded);
    if(nav.style.display === 'block'){
      nav.style.display = '';
    } else {
      nav.style.display = 'block';
    }
  });

  // set year
  const y = new Date().getFullYear();
  document.getElementById('year').textContent = y;
});




// Reveal on scroll
const revealElements = document.querySelectorAll('.reveal');

function revealOnScroll() {
  revealElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
      el.classList.add('active');
    }
  });
}

window.addEventListener('scroll', revealOnScroll);
window.addEventListener('load', revealOnScroll);



// cart icon link
document.querySelector('.cart-btn').addEventListener('click', () => {
  window.location.href = 'cart.html';
});