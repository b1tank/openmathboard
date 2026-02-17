// OpenMathBoard — Hero section
let heroSection = null;

export function initHero(el) {
	heroSection = el;
}

export function hideHeroSection() {
	if (heroSection && !heroSection.classList.contains('hidden')) {
		heroSection.classList.add('hidden');
	}
}

export function showHeroSection() {
	if (heroSection) {
		heroSection.classList.remove('hidden');
	}
}
