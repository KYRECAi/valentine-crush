import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as Lock, d as Clock, i as Trophy, l as Heart, n as VolumeX, o as Star, r as Volume2, s as Pause, t as X, u as Gem } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CZGt22Tj.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ctx = null;
var master = null;
var sfx = null;
var music = null;
var musicTimer = null;
var muted = false;
var musicOn = true;
function ac() {
	if (typeof window === "undefined") return null;
	if (!ctx) {
		ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" });
		master = ctx.createGain();
		sfx = ctx.createGain();
		music = ctx.createGain();
		master.gain.value = .85;
		sfx.gain.value = .7;
		music.gain.value = .22;
		sfx.connect(master);
		music.connect(master);
		master.connect(ctx.destination);
	}
	return ctx;
}
function unlockAudio() {
	const c = ac();
	if (!c) return;
	if (c.state === "suspended") c.resume();
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible" && c.state === "suspended") c.resume();
	});
}
function setMuted(v) {
	muted = v;
	if (master && ctx) master.gain.setTargetAtTime(v ? 0 : .85, ctx.currentTime, .04);
}
function isMuted() {
	return muted;
}
function envGain(duration, peak, start) {
	const g = ctx.createGain();
	g.gain.setValueAtTime(1e-4, start);
	g.gain.exponentialRampToValueAtTime(peak, start + .018);
	g.gain.exponentialRampToValueAtTime(1e-4, start + duration);
	return g;
}
function tone(freq, duration, type, peak, detune = 0) {
	const c = ac();
	if (!c || !sfx || muted) return;
	const t = c.currentTime;
	const o = c.createOscillator();
	o.type = type;
	o.frequency.setValueAtTime(freq, t);
	if (detune) o.detune.setValueAtTime(detune, t);
	const g = envGain(duration, peak, t);
	o.connect(g);
	g.connect(sfx);
	o.start(t);
	o.stop(t + duration + .02);
}
function noiseBurst(duration, peak, hp = 800) {
	const c = ac();
	if (!c || !sfx || muted) return;
	const n = Math.floor(c.sampleRate * duration);
	const buf = c.createBuffer(1, n, c.sampleRate);
	const data = buf.getChannelData(0);
	for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
	const src = c.createBufferSource();
	src.buffer = buf;
	const filter = c.createBiquadFilter();
	filter.type = "highpass";
	filter.frequency.value = hp;
	const t = c.currentTime;
	const g = envGain(duration, peak, t);
	src.connect(filter);
	filter.connect(g);
	g.connect(sfx);
	src.start(t);
	src.stop(t + duration + .02);
}
function sfxCollect(kind, combo) {
	const bump = 1 + Math.min(combo, 12) * .012;
	if (kind === "coin") {
		tone(523.25 * bump, .12, "triangle", .22);
		tone(659.25 * bump, .16, "sine", .16);
		tone(783.99 * bump, .22, "triangle", .18);
		tone(1046.5 * bump, .28, "sine", .12);
		return;
	}
	if (kind === "rainbow") {
		[
			523,
			659,
			784,
			988,
			1174
		].forEach((f, i) => {
			if (!ac()) return;
			setTimeout(() => tone(f, .14, "sine", .1), i * 40);
		});
		return;
	}
	if (kind === "note") {
		tone(698.46, .14, "sine", .16);
		tone(880, .2, "triangle", .12);
		return;
	}
	if (kind === "gem") {
		tone(987.77, .1, "triangle", .14);
		tone(1318.5, .18, "sine", .1);
		return;
	}
	const base = 523.25 * bump;
	tone(base, .09, "sine", .16, (Math.random() * 2 - 1) * 18);
	tone(base * 1.5, .14, "triangle", .08);
}
function sfxThrow() {
	noiseBurst(.18, .12, 400);
	tone(392, .2, "triangle", .1);
	tone(659, .24, "sine", .08);
}
function sfxPulse() {
	tone(440, .12, "sine", .14);
	tone(880, .2, "triangle", .12);
	noiseBurst(.12, .06, 1200);
}
function sfxPower() {
	tone(523, .1, "square", .06);
	tone(784, .18, "sine", .1);
}
function sfxWin() {
	[
		523,
		659,
		784,
		1046,
		784,
		1318
	].forEach((f, i) => setTimeout(() => tone(f, .22, "triangle", .14), i * 90));
}
function sfxUi() {
	tone(660, .07, "sine", .08);
}
function startMusic() {
	stopMusic();
	if (!ac() || !music || !musicOn || muted) return;
	const pattern = [
		261.63,
		329.63,
		392,
		523.25,
		392,
		329.63,
		349.23,
		440
	];
	let i = 0;
	const beat = .55;
	const tick = () => {
		if (!ctx || !music || !musicOn || muted) return;
		const t = ctx.currentTime;
		const o = ctx.createOscillator();
		o.type = "sine";
		o.frequency.setValueAtTime(pattern[i % pattern.length], t);
		const g = ctx.createGain();
		g.gain.setValueAtTime(1e-4, t);
		g.gain.exponentialRampToValueAtTime(.09, t + .04);
		g.gain.exponentialRampToValueAtTime(1e-4, t + beat * .95);
		const o2 = ctx.createOscillator();
		o2.type = "triangle";
		o2.frequency.setValueAtTime(pattern[i % pattern.length] * 2, t);
		const g2 = ctx.createGain();
		g2.gain.setValueAtTime(1e-4, t);
		g2.gain.exponentialRampToValueAtTime(.03, t + .03);
		g2.gain.exponentialRampToValueAtTime(1e-4, t + beat * .7);
		o.connect(g);
		g.connect(music);
		o2.connect(g2);
		g2.connect(music);
		o.start(t);
		o.stop(t + beat);
		o2.start(t);
		o2.stop(t + beat);
		i += 1;
		musicTimer = window.setTimeout(tick, beat * 1e3);
	};
	tick();
}
function stopMusic() {
	if (musicTimer != null) {
		clearTimeout(musicTimer);
		musicTimer = null;
	}
}
var URLS = [
	"/sprites/stan/idle.png",
	"/sprites/stan/throw.png",
	"/sprites/stan/follow.png",
	"/sprites/nova/idle.png",
	"/sprites/nova/point.png",
	"/sprites/nova/cheer.png",
	"/sprites/items/heart.png",
	"/sprites/items/star.png",
	"/sprites/items/gem.png",
	"/sprites/items/note.png",
	"/sprites/items/coin.png",
	"/sprites/items/rainbow.png",
	"/sprites/items/lantern.png",
	"/sprites/items/gift.png",
	"/sprites/items/magnet.png",
	"/sprites/items/pulse.png",
	"/sprites/fx/petal.png",
	"/sprites/family/annie.png",
	"/sprites/family/michael.png",
	"/sprites/family/grandma.png",
	"/sprites/family/kelly.png",
	"/sprites/bg/level-1.jpg",
	"/sprites/bg/level-2.jpg",
	"/sprites/bg/level-3.jpg",
	"/sprites/bg/level-4.jpg",
	"/sprites/bg/level-5.jpg",
	"/sprites/bg/level-6.jpg"
];
var cache = /* @__PURE__ */ new Map();
function getSprite(src) {
	return cache.get(src);
}
function preloadSprites(onProgress) {
	let done = 0;
	return Promise.all(URLS.map((src) => new Promise((resolve) => {
		const existing = cache.get(src);
		if (existing?.complete && existing.naturalWidth > 0) {
			done += 1;
			onProgress?.(done, URLS.length);
			resolve();
			return;
		}
		const img = new Image();
		img.decoding = "async";
		img.onload = () => {
			cache.set(src, img);
			done += 1;
			onProgress?.(done, URLS.length);
			resolve();
		};
		img.onerror = () => {
			done += 1;
			onProgress?.(done, URLS.length);
			resolve();
		};
		img.src = src;
	}))).then(() => void 0);
}
var ITEM_SRC = {
	heart: "/sprites/items/heart.png",
	star: "/sprites/items/star.png",
	gem: "/sprites/items/gem.png",
	note: "/sprites/items/note.png",
	coin: "/sprites/items/coin.png",
	rainbow: "/sprites/items/rainbow.png",
	lantern: "/sprites/items/lantern.png",
	gift: "/sprites/items/gift.png"
};
function renderWorld(ctx, world, now) {
	const { w, h } = world;
	ctx.clearRect(0, 0, w, h);
	const petal = getSprite("/sprites/fx/petal.png");
	for (const p of world.particles) {
		const a = Math.max(0, p.life / p.maxLife);
		ctx.save();
		ctx.globalAlpha = Math.min(1, a * 1.2);
		ctx.translate(p.x, p.y);
		ctx.rotate(p.rot);
		if (p.kind === "petal" && petal) ctx.drawImage(petal, -p.size / 2, -p.size / 2, p.size, p.size);
		else if (p.kind === "spark") {
			ctx.fillStyle = p.color;
			ctx.beginPath();
			ctx.arc(0, 0, p.size * a, 0, Math.PI * 2);
			ctx.fill();
		} else if (p.kind === "text" && p.text) {
			ctx.rotate(-p.rot);
			ctx.font = "700 16px Fredoka, Nunito, sans-serif";
			ctx.textAlign = "center";
			ctx.lineWidth = 4;
			ctx.strokeStyle = "rgba(58,32,68,0.35)";
			ctx.fillStyle = p.color;
			ctx.strokeText(p.text, 0, 0);
			ctx.fillText(p.text, 0, 0);
		}
		ctx.restore();
	}
	for (const it of world.items) {
		const img = getSprite(ITEM_SRC[it.kind]);
		const pulse = 1 + Math.sin(now * .006 + it.id) * .05;
		const s = it.size * pulse;
		ctx.save();
		ctx.translate(it.x, it.y);
		ctx.rotate(it.rot * .25);
		if (it.kind === "coin") {
			ctx.shadowColor = "rgba(240,180,41,0.85)";
			ctx.shadowBlur = 18;
		} else if (it.fromStan) {
			ctx.shadowColor = "rgba(255,91,138,0.7)";
			ctx.shadowBlur = 14;
		}
		if (img) ctx.drawImage(img, -s / 2, -s / 2, s, s);
		ctx.restore();
	}
	if (world.pulse) {
		const img = getSprite("/sprites/items/pulse.png");
		const s = 128 * Math.max(.35, world.pulse.scale);
		ctx.save();
		ctx.translate(world.pulse.x, world.pulse.y);
		ctx.shadowColor = "rgba(126,200,255,0.9)";
		ctx.shadowBlur = 24;
		if (img) ctx.drawImage(img, -s / 2, -s / 2, s, s);
		ctx.restore();
	}
}
var LEVELS = [
	{
		id: 1,
		name: "Blossom Park",
		tagline: "Where love first rains",
		duration: 90,
		heartGoal: 40,
		spawnPerSec: 1.55,
		fallSpeed: 92,
		coinEvery: 14,
		rainbowChance: .07,
		bg: "/sprites/bg/level-1.jpg"
	},
	{
		id: 2,
		name: "Rainbow Canal",
		tagline: "Follow the bright ribbons",
		duration: 85,
		heartGoal: 55,
		spawnPerSec: 1.85,
		fallSpeed: 108,
		coinEvery: 12,
		rainbowChance: .13,
		bg: "/sprites/bg/level-2.jpg"
	},
	{
		id: 3,
		name: "Starlight Plaza",
		tagline: "Wish on every star",
		duration: 80,
		heartGoal: 70,
		spawnPerSec: 2.15,
		fallSpeed: 122,
		coinEvery: 11,
		rainbowChance: .08,
		bg: "/sprites/bg/level-3.jpg"
	},
	{
		id: 4,
		name: "Heart Harbor",
		tagline: "Notes across the water",
		duration: 75,
		heartGoal: 85,
		spawnPerSec: 2.45,
		fallSpeed: 136,
		coinEvery: 10,
		rainbowChance: .1,
		bg: "/sprites/bg/level-4.jpg"
	},
	{
		id: 5,
		name: "Crystal Clouds",
		tagline: "High rolling in the sky",
		duration: 70,
		heartGoal: 95,
		spawnPerSec: 2.75,
		fallSpeed: 150,
		coinEvery: 8,
		rainbowChance: .14,
		bg: "/sprites/bg/level-5.jpg"
	},
	{
		id: 6,
		name: "Forever City",
		tagline: "The whole family, all at once",
		duration: 95,
		heartGoal: 120,
		spawnPerSec: 3.15,
		fallSpeed: 164,
		coinEvery: 7,
		rainbowChance: .16,
		bg: "/sprites/bg/level-6.jpg"
	}
];
var FAMILY = [
	{
		id: "annie",
		name: "Annie",
		portrait: "/sprites/family/annie.png",
		color: "var(--color-love)"
	},
	{
		id: "michael",
		name: "Michael",
		portrait: "/sprites/family/michael.png",
		color: "var(--color-sky)"
	},
	{
		id: "grandma",
		name: "Grandma",
		portrait: "/sprites/family/grandma.png",
		color: "var(--color-gem)"
	},
	{
		id: "kelly",
		name: "Kelly",
		portrait: "/sprites/family/kelly.png",
		color: "var(--color-gold)"
	}
];
var ITEM_SCORE = {
	heart: 50,
	star: 100,
	gem: 80,
	note: 70,
	coin: 250,
	rainbow: 120,
	lantern: 90,
	gift: 180
};
var ITEM_SIZE = {
	heart: 58,
	star: 52,
	gem: 50,
	note: 54,
	coin: 70,
	rainbow: 74,
	lantern: 60,
	gift: 56
};
var KINDS = [
	"heart",
	"star",
	"gem",
	"note",
	"lantern",
	"gift"
];
var KIND_W = [
	42,
	14,
	12,
	12,
	10,
	6
];
var COMBO_LABELS = [
	"Nice",
	"Sweet",
	"Lovely",
	"Amazing",
	"Radiant",
	"Unstoppable"
];
var STAN_LINES = [
	"Love incoming!",
	"Hearts for you!",
	"Catch these!",
	"Mid-love special!"
];
var NOVA_POINT = [
	"High roller! 250!",
	"That's the big one!",
	"Go get it!",
	"Coin in the sky!"
];
var NOVA_CHEER = [
	"You've got this!",
	"So much love!",
	"Family's cheering!",
	"Keep going!"
];
function pick(arr, rng) {
	return arr[Math.floor(rng() * arr.length)];
}
function weightedKind(rng) {
	const total = KIND_W.reduce((a, b) => a + b, 0);
	let r = rng() * total;
	for (let i = 0; i < KINDS.length; i++) {
		r -= KIND_W[i];
		if (r <= 0) return KINDS[i];
	}
	return "heart";
}
function otherMember(id, rng) {
	return pick(FAMILY.map((m) => m.id).filter((x) => x !== id), rng);
}
var LoveWorld = class {
	w = 390;
	h = 844;
	level;
	items = [];
	particles = [];
	pulse = null;
	timeLeft;
	hearts = 0;
	familyPoints = 0;
	score = 0;
	scoreDelta = 0;
	combo = 0;
	maxCombo = 0;
	loveMeter = .18;
	lovePeak = .18;
	coins = 0;
	notes = 0;
	members = {
		annie: 0,
		michael: 0,
		grandma: 0,
		kelly: 0
	};
	feed = null;
	feedTimer = 0;
	stanPose = "idle";
	novaPose = "idle";
	stanLine = null;
	novaLine = null;
	stanTimer = 0;
	novaTimer = 0;
	magnetCharges = 3;
	gemCharges = 2;
	burstCd = 0;
	magnetT = 0;
	gemT = 0;
	spawnAcc = 0;
	coinAcc = 0;
	pulseAcc = 0;
	throwCd = 0;
	cheerCd = 0;
	elapsed = 0;
	over = false;
	shake = 0;
	nextId = 1;
	rng;
	playTop;
	playBottom;
	reduced = false;
	constructor(levelId, seed = Date.now()) {
		this.level = LEVELS[levelId - 1] ?? LEVELS[0];
		this.timeLeft = this.level.duration;
		this.playTop = .2;
		this.playBottom = .6;
		let s = seed >>> 0;
		this.rng = () => {
			s = s * 1664525 + 1013904223 >>> 0;
			return s / 4294967295;
		};
		if (typeof window !== "undefined") this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	}
	resize(w, h) {
		this.w = w;
		this.h = h;
	}
	bonus() {
		return this.gemT > 0 ? 2 : 1;
	}
	comboLabel() {
		if (this.combo < 3) return "";
		return COMBO_LABELS[Math.min(COMBO_LABELS.length - 1, Math.floor((this.combo - 3) / 3))];
	}
	snapshot() {
		const feed = this.feed ? `${FAMILY.find((m) => m.id === this.feed.from)?.name} sent a love note to ${FAMILY.find((m) => m.id === this.feed.to)?.name}` : null;
		return {
			timeLeft: this.timeLeft,
			hearts: this.hearts,
			familyPoints: this.familyPoints,
			bonus: this.bonus(),
			score: this.score,
			scoreDelta: this.scoreDelta,
			combo: this.combo,
			comboLabel: this.comboLabel(),
			loveMeter: this.loveMeter,
			members: { ...this.members },
			feed,
			stanPose: this.stanPose,
			novaPose: this.novaPose,
			stanLine: this.stanLine,
			novaLine: this.novaLine,
			magnetCharges: this.magnetCharges,
			gemCharges: this.gemCharges,
			burstReady: this.burstCd <= 0,
			heartGoal: this.level.heartGoal,
			magnetActive: this.magnetT > 0,
			gemActive: this.gemT > 0,
			shake: this.shake,
			pulseActive: !!this.pulse
		};
	}
	stats() {
		const lovePeak = this.lovePeak;
		const hearts = this.hearts;
		const goal = this.level.heartGoal;
		let stars = 1;
		if (hearts >= goal) stars = 2;
		if (hearts >= goal && (this.maxCombo >= 8 || lovePeak >= .72)) stars = 3;
		return {
			levelId: this.level.id,
			score: this.score,
			hearts,
			familyPoints: this.familyPoints,
			maxCombo: this.maxCombo,
			coins: this.coins,
			notes: this.notes,
			lovePeak,
			stars
		};
	}
	step(dt) {
		if (this.over) return;
		const cap = Math.min(dt, .1);
		this.elapsed += cap;
		this.timeLeft = Math.max(0, this.timeLeft - cap);
		if (this.timeLeft <= 0) {
			this.over = true;
			return;
		}
		this.spawnAcc += cap;
		const interval = 1 / this.level.spawnPerSec;
		while (this.spawnAcc >= interval) {
			this.spawnAcc -= interval;
			this.spawnFalling();
		}
		if (this.elapsed < .12 && this.items.length < 6) for (let i = 0; i < 5; i++) this.spawnKind(weightedKind(this.rng), void 0, this.h * (this.playTop + .04 + i * .07));
		this.coinAcc += cap;
		if (this.coinAcc >= this.level.coinEvery) {
			this.coinAcc = 0;
			this.spawnCoin();
		}
		this.pulseAcc += cap;
		if (!this.pulse && this.pulseAcc >= 13) {
			this.pulseAcc = 0;
			this.pulse = {
				x: this.w * (.42 + this.rng() * .16),
				y: this.h * (.38 + this.rng() * .1),
				life: 3.6,
				maxLife: 3.6,
				scale: .2
			};
		}
		if (this.level.rainbowChance > 0 && this.rng() < this.level.rainbowChance * cap * .35) this.spawnKind("rainbow");
		this.throwCd = Math.max(0, this.throwCd - cap);
		this.cheerCd = Math.max(0, this.cheerCd - cap);
		this.stanTimer = Math.max(0, this.stanTimer - cap);
		this.novaTimer = Math.max(0, this.novaTimer - cap);
		this.magnetT = Math.max(0, this.magnetT - cap);
		this.gemT = Math.max(0, this.gemT - cap);
		this.burstCd = Math.max(0, this.burstCd - cap);
		this.feedTimer = Math.max(0, this.feedTimer - cap);
		this.shake = Math.max(0, this.shake - cap * 2.4);
		if (this.stanTimer <= 0) {
			this.stanPose = "idle";
			this.stanLine = null;
		} else if (this.stanPose === "throw" && this.stanTimer < .55) this.stanPose = "follow";
		if (this.novaTimer <= 0) {
			this.novaPose = "idle";
			this.novaLine = null;
		}
		if (this.feedTimer <= 0) this.feed = null;
		this.loveMeter = Math.max(0, this.loveMeter - cap * .012);
		this.scoreDelta = Math.max(0, this.scoreDelta - cap * 180);
		if (this.pulse) {
			this.pulse.life -= cap;
			const t = 1 - this.pulse.life / this.pulse.maxLife;
			this.pulse.scale = t < .15 ? t / .15 : t > .82 ? (1 - t) / .18 : 1;
			if (this.pulse.life <= 0) this.pulse = null;
		}
		const gravity = 38;
		const magOn = this.magnetT > 0;
		const magX = this.w * .5;
		const magY = this.h * .42;
		const bottom = this.h * this.playBottom;
		for (let i = this.items.length - 1; i >= 0; i--) {
			const it = this.items[i];
			if (magOn && !it.magnetImmune) {
				const dx = magX - it.x;
				const dy = magY - it.y;
				it.vx += dx * 2.1 * cap;
				it.vy += dy * 1.4 * cap;
			}
			it.vy += gravity * cap;
			it.x += it.vx * cap;
			it.y += it.vy * cap;
			it.rot += it.vr * cap;
			if (it.x < it.size * .4) {
				it.x = it.size * .4;
				it.vx *= -.4;
			}
			if (it.x > this.w - it.size * .4) {
				it.x = this.w - it.size * .4;
				it.vx *= -.4;
			}
			if (it.y > bottom + it.size) {
				if (it.kind === "heart" && !it.fromStan) {
					this.combo = 0;
					this.loveMeter = Math.max(0, this.loveMeter - .035);
				}
				this.items.splice(i, 1);
			}
		}
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];
			p.life -= cap;
			p.x += p.vx * cap;
			p.y += p.vy * cap;
			p.vy += 40 * cap;
			p.rot += p.vr * cap;
			if (p.life <= 0) this.particles.splice(i, 1);
		}
		if (this.rng() < cap * 6) this.spawnPetal(this.rng() * this.w, -12, false);
	}
	spawnFalling() {
		const kind = weightedKind(this.rng);
		this.spawnKind(kind);
	}
	spawnKind(kind, x, y, vx, vy, fromStan = false) {
		const size = ITEM_SIZE[kind];
		const speed = this.level.fallSpeed * (.78 + this.rng() * .45);
		const item = {
			id: this.nextId++,
			kind,
			x: x ?? size + this.rng() * (this.w - size * 2),
			y: y ?? this.h * this.playTop - 30 - this.rng() * 40,
			vx: vx ?? (this.rng() - .5) * 36,
			vy: vy ?? speed * (.35 + this.rng() * .2),
			rot: this.rng() * Math.PI * 2,
			vr: (this.rng() - .5) * 2.2,
			size,
			born: this.elapsed,
			fromStan,
			magnetImmune: kind === "coin"
		};
		this.items.push(item);
		return item;
	}
	spawnCoin() {
		this.spawnKind("coin", this.w * (.28 + this.rng() * .44), this.h * this.playTop - 20, (this.rng() - .5) * 18, this.level.fallSpeed * .22);
		this.novaPose = "point";
		this.novaLine = pick(NOVA_POINT, this.rng);
		this.novaTimer = 3.2;
	}
	spawnPetal(x, y, burst) {
		if (this.particles.length > 90) return;
		this.particles.push({
			id: this.nextId++,
			x,
			y,
			vx: (this.rng() - .5) * (burst ? 140 : 28),
			vy: burst ? -40 - this.rng() * 80 : 18 + this.rng() * 30,
			life: burst ? .7 + this.rng() * .4 : 3.2,
			maxLife: 3.2,
			size: 10 + this.rng() * 10,
			kind: "petal",
			color: "#ff8fb3",
			rot: this.rng() * 6,
			vr: (this.rng() - .5) * 4
		});
	}
	popText(x, y, text, color) {
		this.particles.push({
			id: this.nextId++,
			x,
			y,
			vx: 0,
			vy: -52,
			life: .7,
			maxLife: .7,
			size: 18,
			kind: "text",
			color,
			text,
			rot: 0,
			vr: 0
		});
	}
	sparks(x, y, color) {
		const n = this.reduced ? 4 : 10;
		for (let i = 0; i < n; i++) {
			const a = this.rng() * Math.PI * 2;
			const sp = 40 + this.rng() * 90;
			this.particles.push({
				id: this.nextId++,
				x,
				y,
				vx: Math.cos(a) * sp,
				vy: Math.sin(a) * sp - 30,
				life: .35 + this.rng() * .25,
				maxLife: .5,
				size: 3 + this.rng() * 4,
				kind: "spark",
				color,
				rot: 0,
				vr: 0
			});
		}
	}
	collectItem(it) {
		const idx = this.items.findIndex((x) => x.id === it.id);
		if (idx < 0) return null;
		this.items.splice(idx, 1);
		this.combo += 1;
		this.maxCombo = Math.max(this.maxCombo, this.combo);
		const add = Math.round(ITEM_SCORE[it.kind] * this.bonus() * (1 + Math.min(this.combo, 12) * .04));
		this.score += add;
		this.scoreDelta = add;
		const who = pick(FAMILY, this.rng).id;
		this.members[who] += it.kind === "star" || it.kind === "note" || it.kind === "gift" ? add : Math.round(add * .35);
		if (it.kind === "heart") {
			this.hearts += 1;
			this.loveMeter = Math.min(1, this.loveMeter + .028);
			if (this.hearts > 0 && this.hearts % 100 === 0) {
				this.familyPoints += 400;
				this.score += 400;
				this.popText(it.x, it.y - 24, "Family bonus!", "#f0b429");
			}
		} else if (it.kind === "star") this.familyPoints += 80;
		else if (it.kind === "note") {
			this.notes += 1;
			this.familyPoints += 60;
			this.feed = {
				from: who,
				to: otherMember(who, this.rng)
			};
			this.feedTimer = 3.4;
		} else if (it.kind === "coin") {
			this.coins += 1;
			this.familyPoints += 40;
			this.novaPose = "cheer";
			this.novaLine = pick(NOVA_CHEER, this.rng);
			this.novaTimer = 2.4;
		} else if (it.kind === "rainbow") {
			this.loveMeter = Math.min(1, this.loveMeter + .14);
			for (let i = 0; i < 14; i++) this.spawnPetal(it.x, it.y, true);
		} else if (it.kind === "gem") this.gemT = Math.max(this.gemT, 3.2);
		else if (it.kind === "gift") {
			this.familyPoints += 120;
			this.hearts += 3;
		} else if (it.kind === "lantern") this.familyPoints += 40;
		this.lovePeak = Math.max(this.lovePeak, this.loveMeter);
		this.shake = Math.min(1, this.shake + (it.kind === "coin" ? .45 : .18));
		this.sparks(it.x, it.y, it.kind === "coin" ? "#f0b429" : it.kind === "gem" ? "#9b6dff" : "#ff6b9a");
		this.popText(it.x, it.y - 10, `+${add}`, it.kind === "coin" ? "#f0b429" : "#fff7fa");
		this.maybeStanThrow();
		if (this.combo === 6 || this.combo === 12 || this.combo === 18) this.maybeNovaCheer();
		return {
			kind: it.kind,
			add
		};
	}
	maybeStanThrow() {
		const midLove = this.loveMeter >= .48;
		const comboHit = this.combo === 5 || this.combo === 10 || this.combo === 15 || this.combo === 20;
		if (this.throwCd > 0) return;
		if (!midLove && !comboHit) return;
		if (!comboHit && this.loveMeter < .5) return;
		this.throwCd = 7.5;
		this.stanPose = "throw";
		this.stanLine = pick(STAN_LINES, this.rng);
		this.stanTimer = 1.8;
		const ox = this.w * .18;
		const oy = this.h * .48;
		const n = 7;
		for (let i = 0; i < n; i++) {
			const t = (i + .5) / n;
			this.spawnKind("heart", ox, oy, 40 + t * 180, -160 - this.rng() * 70, true);
		}
	}
	maybeNovaCheer() {
		if (this.cheerCd > 0) return;
		this.cheerCd = 6;
		this.novaPose = "cheer";
		this.novaLine = pick(NOVA_CHEER, this.rng);
		this.novaTimer = 2.2;
	}
	tap(x, y) {
		if (this.over) return null;
		if (this.pulse) {
			const dx = x - this.pulse.x;
			const dy = y - this.pulse.y;
			const r = 58 * Math.max(.45, this.pulse.scale);
			if (dx * dx + dy * dy <= r * r) {
				this.pulse = null;
				this.hearts += 5;
				this.combo += 2;
				this.maxCombo = Math.max(this.maxCombo, this.combo);
				const add = Math.round(200 * this.bonus());
				this.score += add;
				this.scoreDelta = add;
				this.loveMeter = Math.min(1, this.loveMeter + .08);
				this.shake = Math.min(1, this.shake + .5);
				for (let i = 0; i < 16; i++) this.spawnPetal(x, y, true);
				this.popText(x, y - 16, "+5 hearts", "#ff6b9a");
				this.maybeStanThrow();
				return {
					kind: "pulse",
					add
				};
			}
		}
		let best = null;
		let bestD = 1e9;
		for (const it of this.items) {
			const dx = x - it.x;
			const dy = y - it.y;
			const rad = it.size * .62;
			const d = dx * dx + dy * dy;
			if (d <= rad * rad && d < bestD) {
				best = it;
				bestD = d;
			}
		}
		if (!best) return null;
		return this.collectItem(best);
	}
	useMagnet() {
		if (this.magnetCharges <= 0 || this.magnetT > 0) return false;
		this.magnetCharges -= 1;
		this.magnetT = 5.2;
		return true;
	}
	useGem() {
		if (this.gemCharges <= 0 || this.gemT > 1) return false;
		this.gemCharges -= 1;
		this.gemT = 8;
		return true;
	}
	useBurst() {
		if (this.burstCd > 0) return false;
		this.burstCd = 11;
		const cx = this.w * .5;
		const cy = this.h * .42;
		const r2 = 16900;
		this.items.filter((it) => {
			const dx = it.x - cx;
			const dy = it.y - cy;
			return dx * dx + dy * dy <= r2;
		}).forEach((it) => this.collectItem(it));
		for (let i = 0; i < 18; i++) this.spawnPetal(cx, cy, true);
		this.shake = Math.min(1, this.shake + .4);
		return true;
	}
};
function fmtTime(t) {
	const s = Math.max(0, Math.ceil(t));
	return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function fmt(n) {
	return Math.round(n).toLocaleString();
}
var STAN = {
	idle: "/sprites/stan/idle.png",
	throw: "/sprites/stan/throw.png",
	follow: "/sprites/stan/follow.png"
};
var NOVA = {
	idle: "/sprites/nova/idle.png",
	point: "/sprites/nova/point.png",
	cheer: "/sprites/nova/cheer.png"
};
var emptyHud = () => ({
	timeLeft: 0,
	hearts: 0,
	familyPoints: 0,
	bonus: 1,
	score: 0,
	scoreDelta: 0,
	combo: 0,
	comboLabel: "",
	loveMeter: 0,
	members: {
		annie: 0,
		michael: 0,
		grandma: 0,
		kelly: 0
	},
	feed: null,
	stanPose: "idle",
	novaPose: "idle",
	stanLine: null,
	novaLine: null,
	magnetCharges: 3,
	gemCharges: 2,
	burstReady: true,
	heartGoal: 40,
	magnetActive: false,
	gemActive: false,
	shake: 0,
	pulseActive: false
});
function PlayScreen(props) {
	const wrapRef = (0, import_react.useRef)(null);
	const canvasRef = (0, import_react.useRef)(null);
	const worldRef = (0, import_react.useRef)(null);
	const [hud, setHud] = (0, import_react.useState)(emptyHud);
	const [paused, setPaused] = (0, import_react.useState)(false);
	const [hint, setHint] = (0, import_react.useState)(true);
	const pausedRef = (0, import_react.useRef)(false);
	pausedRef.current = paused;
	(0, import_react.useEffect)(() => {
		const world = new LoveWorld(props.levelId);
		worldRef.current = world;
		setHud(world.snapshot());
		setHint(true);
		const hide = window.setTimeout(() => setHint(false), 4200);
		const canvas = canvasRef.current;
		const wrap = wrapRef.current;
		if (!canvas || !wrap) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const fit = () => {
			const r = wrap.getBoundingClientRect();
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			canvas.width = Math.max(1, Math.floor(r.width * dpr));
			canvas.height = Math.max(1, Math.floor(r.height * dpr));
			canvas.style.width = `${r.width}px`;
			canvas.style.height = `${r.height}px`;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			world.resize(r.width, r.height);
		};
		fit();
		const ro = new ResizeObserver(fit);
		ro.observe(wrap);
		let last = performance.now();
		let hudAcc = 0;
		let raf = 0;
		const loop = (now) => {
			const dt = Math.min(.1, (now - last) / 1e3);
			last = now;
			if (!pausedRef.current) {
				const prevStan = world.stanPose;
				world.step(dt);
				if (prevStan !== "throw" && world.stanPose === "throw") sfxThrow();
				hudAcc += dt;
				if (hudAcc >= .08) {
					hudAcc = 0;
					setHud(world.snapshot());
				}
				if (world.over) {
					setHud(world.snapshot());
					props.onComplete(world.stats(), world.members);
					return;
				}
			}
			renderWorld(ctx, world, now);
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			window.clearTimeout(hide);
		};
	}, [props.levelId, props.onComplete]);
	const pointer = (e) => {
		const world = worldRef.current;
		const canvas = canvasRef.current;
		if (!world || !canvas || paused) return;
		const r = canvas.getBoundingClientRect();
		const x = e.clientX - r.left;
		const y = e.clientY - r.top;
		const hit = world.tap(x, y);
		if (hit) {
			if (hit.kind === "pulse") sfxPulse();
			else sfxCollect(hit.kind, world.combo);
			setHud(world.snapshot());
		}
	};
	const leader = Object.entries(hud.members).sort((a, b) => b[1] - a[1])[0]?.[0];
	const shake = hud.shake * hud.shake * 7;
	const sx = shake ? (Math.random() - .5) * shake : 0;
	const sy = shake ? (Math.random() - .5) * shake : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex h-full min-h-0 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref: wrapRef,
				className: "absolute inset-0",
				style: { transform: `translate(${sx}px, ${sy}px)` },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
						ref: canvasRef,
						className: "absolute inset-0 z-20 h-full w-full touch-none",
						onPointerDown: pointer
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: STAN[hud.stanPose],
						alt: "Stan",
						className: "pointer-events-none absolute bottom-[34%] left-[-8%] z-10 w-[42%] max-w-48 origin-bottom idle-bob select-none",
						draggable: false
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: NOVA[hud.novaPose],
						alt: "Nova",
						className: "pointer-events-none absolute right-[-8%] bottom-[34%] z-10 w-[40%] max-w-48 origin-bottom idle-bob-late select-none",
						draggable: false
					}),
					hud.stanLine ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Speech, {
						side: "left",
						text: hud.stanLine,
						who: "Stan"
					}) : null,
					hud.novaLine ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Speech, {
						side: "right",
						text: hud.novaLine,
						who: "Nova"
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "relative z-30 px-3 pt-[max(0.45rem,env(safe-area-inset-top))]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "glass-panel flex items-center gap-2 rounded-[18px] px-1.5 py-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
								onClick: () => setPaused(true),
								label: "Pause",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display min-w-0 flex-1 text-center text-[14px] font-semibold tracking-tight text-ink",
								children: "Valentine's Love Dash"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
								onClick: props.onExit,
								label: "Exit",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1.5 grid grid-cols-4 gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								chip: "time",
								label: "Time Left",
								value: fmtTime(hud.timeLeft),
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-3.5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								chip: "heart",
								label: "Hearts",
								value: String(hud.hearts)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								chip: "star",
								label: "Family Points",
								value: fmt(hud.familyPoints),
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-3.5 fill-gold text-gold" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								chip: "gem",
								label: "Bonus",
								value: `x${hud.bonus}`,
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gem, { className: "size-3.5" }),
								hot: hud.gemActive
							})
						]
					}),
					hud.feed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "glass-panel mt-1.5 flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold text-ink",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: "/sprites/items/note.png",
							alt: "",
							className: "size-5"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate",
							children: hud.feed
						})]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "relative z-0 min-h-0 flex-1 pointer-events-none" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "relative z-30 space-y-1.5 px-3 pb-[max(0.45rem,env(safe-area-inset-bottom))]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "glass-panel flex items-center gap-2 rounded-[16px] px-2.5 py-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: "/sprites/items/heart.png",
								alt: "",
								className: "size-6"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[10px] font-bold text-ink",
									children: [
										"Collect ",
										hud.heartGoal,
										" hearts for family bonus"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-0.5 h-1.5 overflow-hidden rounded-full bg-cream-deep",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-full rounded-full bg-love transition-[width] duration-300",
										style: { width: `${Math.min(100, hud.hearts / hud.heartGoal * 100)}%` }
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-display text-[11px] font-semibold text-ink-soft tabular-nums",
								children: [
									hud.hearts,
									"/",
									hud.heartGoal
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: "/sprites/items/gift.png",
								alt: "",
								className: "size-6"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "glass-panel rounded-[18px] px-2.5 py-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-3 gap-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "flex items-center gap-1 text-[9px] font-bold tracking-wide text-ink-soft uppercase",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, { className: "size-3 text-gold" }), " Team Score"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-display text-lg leading-none font-semibold text-ink tabular-nums",
										children: fmt(hud.score)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[10px] font-bold text-love",
										children: ["+", Math.round(hud.scoreDelta)]
									})
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-center",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[9px] font-bold tracking-wide text-ink-soft uppercase",
											children: "Kindness Combo"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "font-display text-lg leading-none font-semibold text-love",
											children: ["x", hud.combo]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] font-bold text-ink-soft",
											children: hud.comboLabel || "Tap to start"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-right text-[9px] font-bold tracking-wide text-ink-soft uppercase",
										children: "Love Meter"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-1 h-1.5 overflow-hidden rounded-full bg-cream-deep",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-full rounded-full bg-gem transition-[width] duration-300",
											style: { width: `${Math.round(hud.loveMeter * 100)}%` }
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-0.5 text-right text-[10px] font-bold text-gem",
										children: [
											Math.round(hud.loveMeter * 100),
											"% ",
											hud.loveMeter > .55 ? "So much love!" : "Warming up"
										]
									})
								] })
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1.5 flex justify-between gap-1",
							children: FAMILY.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex min-w-0 flex-1 flex-col items-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: m.portrait,
											alt: m.name,
											className: "size-9 rounded-full border-2 border-white object-cover shadow-sm"
										}), leader === m.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "absolute -top-1 -right-1 grid size-3.5 place-items-center rounded-full bg-gold text-[8px] text-ink",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-2 fill-ink text-ink" })
										}) : null]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-0.5 truncate text-[9px] font-bold text-ink",
										children: m.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[9px] font-semibold text-love tabular-nums",
										children: fmt(hud.members[m.id])
									})
								]
							}, m.id))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-end justify-between px-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PowerBtn, {
								label: "Magnet",
								count: hud.magnetCharges,
								active: hud.magnetActive,
								disabled: hud.magnetCharges <= 0,
								onClick: () => {
									if (worldRef.current?.useMagnet()) {
										sfxPower();
										setHud(worldRef.current.snapshot());
									}
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: "/sprites/items/magnet.png",
									alt: "",
									className: "size-8"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: !hud.burstReady,
								onClick: () => {
									if (worldRef.current?.useBurst()) {
										sfxPulse();
										setHud(worldRef.current.snapshot());
									}
								},
								className: "pulse-glow grid size-14 place-items-center rounded-full border-4 border-white bg-love shadow-[0_10px_24px_rgb(255_91_138_/_0.45)] disabled:opacity-50",
								"aria-label": "Love burst",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: "/sprites/items/heart.png",
									alt: "",
									className: "size-8"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PowerBtn, {
								label: "Gem",
								count: hud.gemCharges,
								active: hud.gemActive,
								disabled: hud.gemCharges <= 0,
								onClick: () => {
									if (worldRef.current?.useGem()) {
										sfxPower();
										setHud(worldRef.current.snapshot());
									}
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: "/sprites/items/gem.png",
									alt: "",
									className: "size-8"
								})
							})
						]
					})
				]
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-x-8 top-[38%] z-40 rounded-[18px] bg-dusk/70 px-4 py-3 text-center text-cream backdrop-blur-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-base font-semibold",
					children: "Tap the raining love"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs leading-snug text-cream/85",
					children: "Stan throws extra hearts at mid-love. Nova points at the 250-point coins."
				})]
			}) : null,
			paused ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 z-50 grid place-items-center bg-dusk/70 px-8 backdrop-blur-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "glass-panel w-full max-w-xs rounded-[28px] p-5 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl font-semibold text-ink",
							children: "Paused"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-ink-soft",
							children: "The family can wait a beat."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "rounded-full bg-love px-4 py-3 font-display text-sm font-semibold text-cream",
								onClick: () => setPaused(false),
								children: "Keep catching"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "rounded-full bg-cream-deep px-4 py-3 text-sm font-bold text-ink",
								onClick: props.onExit,
								children: "Leave run"
							})]
						})
					]
				})
			}) : null
		]
	});
}
function Speech({ side, text, who }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `absolute bottom-[52%] z-30 max-w-[46%] rounded-2xl bg-cream px-3 py-2 text-[12px] font-bold text-ink shadow-glass ${side === "left" ? "left-[8%]" : "right-[8%]"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[9px] tracking-wide text-love uppercase",
			children: who
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: text })]
	});
}
function IconBtn({ children, onClick, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": label,
		onClick,
		className: "grid size-8 place-items-center rounded-full bg-cream-deep text-ink",
		children
	});
}
function Stat({ label, value, icon, chip, hot }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `glass-panel rounded-[12px] px-1 py-1 text-center ${hot ? "ring-2 ring-gem" : ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "flex items-center justify-center gap-0.5 text-[9px] font-bold tracking-wide text-ink-soft uppercase",
			children: [chip === "heart" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: "/sprites/items/heart.png",
				alt: "",
				className: "size-3.5"
			}) : icon, label]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-sm font-semibold text-ink tabular-nums",
			children: value
		})]
	});
}
function PowerBtn({ children, label, count, active, disabled, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		"aria-label": label,
		disabled,
		onClick,
		className: `relative grid size-14 place-items-center rounded-full border-2 bg-cream/90 shadow-glass disabled:opacity-45 ${active ? "border-love" : "border-white"}`,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full bg-love text-[10px] font-bold text-cream",
			children: count
		})]
	});
}
var KEY = "kyrec-love-dash-v1";
var EMPTY = {
	version: 1,
	familyPoints: 0,
	memberScores: {
		annie: 0,
		michael: 0,
		grandma: 0,
		kelly: 0
	},
	levelStars: {},
	bestScore: 0,
	totalHearts: 0,
	unlocked: 1
};
function loadSave() {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return {
			...EMPTY,
			memberScores: { ...EMPTY.memberScores }
		};
		const parsed = JSON.parse(raw);
		return {
			...EMPTY,
			...parsed,
			version: 1,
			memberScores: {
				...EMPTY.memberScores,
				...parsed.memberScores
			},
			levelStars: { ...parsed.levelStars },
			unlocked: Math.max(1, Math.min(6, parsed.unlocked ?? 1))
		};
	} catch {
		return {
			...EMPTY,
			memberScores: { ...EMPTY.memberScores }
		};
	}
}
function writeSave(data) {
	localStorage.setItem(KEY, JSON.stringify(data));
}
function applyRunToSave(save, input) {
	const stars = Math.max(save.levelStars[String(input.levelId)] ?? 0, input.stars);
	const unlocked = input.stars >= 1 ? Math.max(save.unlocked, Math.min(6, input.levelId + 1)) : save.unlocked;
	const memberScores = { ...save.memberScores };
	Object.keys(memberScores).forEach((id) => {
		memberScores[id] += input.memberDelta[id] ?? 0;
	});
	const next = {
		version: 1,
		familyPoints: save.familyPoints + input.familyPoints,
		memberScores,
		levelStars: {
			...save.levelStars,
			[String(input.levelId)]: stars
		},
		bestScore: Math.max(save.bestScore, input.score),
		totalHearts: save.totalHearts + input.hearts,
		unlocked
	};
	writeSave(next);
	return next;
}
var EMPTY_SAVE = {
	version: 1,
	familyPoints: 0,
	memberScores: {
		annie: 0,
		michael: 0,
		grandma: 0,
		kelly: 0
	},
	levelStars: {},
	bestScore: 0,
	totalHearts: 0,
	unlocked: 1
};
function GameApp() {
	const [screen, setScreen] = (0, import_react.useState)("title");
	const [save, setSave] = (0, import_react.useState)(EMPTY_SAVE);
	const [levelId, setLevelId] = (0, import_react.useState)(1);
	const [lastRun, setLastRun] = (0, import_react.useState)(null);
	const [mute, setMute] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setSave(loadSave());
		preloadSprites();
	}, []);
	const go = (next) => {
		sfxUi();
		setScreen(next);
	};
	const playLevel = (id) => {
		unlockAudio();
		startMusic();
		sfxUi();
		setLevelId(id);
		setScreen("play");
	};
	const onComplete = (0, import_react.useCallback)((stats, members) => {
		stopMusic();
		sfxWin();
		setLastRun(stats);
		setSave((prev) => applyRunToSave(prev, {
			levelId: stats.levelId,
			score: stats.score,
			hearts: stats.hearts,
			familyPoints: stats.familyPoints,
			stars: stats.stars,
			memberDelta: members
		}));
		setScreen("results");
	}, []);
	const onExitPlay = (0, import_react.useCallback)(() => {
		stopMusic();
		setScreen("levels");
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		bg: screen === "play" ? LEVELS[levelId - 1]?.bg ?? "/sprites/bg/level-1.jpg" : screen === "results" ? LEVELS[(lastRun?.levelId ?? 1) - 1]?.bg ?? "/sprites/bg/level-1.jpg" : "/sprites/bg/level-1.jpg",
		children: [
			screen === "title" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TitleScreen, {
				save,
				mute,
				onMute: () => {
					const next = !mute;
					setMute(next);
					setMuted(next);
				},
				onPlay: () => playLevel(Math.min(save.unlocked, 6)),
				onLevels: () => go("levels"),
				onFamily: () => go("family")
			}) : null,
			screen === "levels" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LevelSelect, {
				save,
				onBack: () => go("title"),
				onPlay: playLevel
			}) : null,
			screen === "family" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FamilyScreen, {
				save,
				onBack: () => go("title")
			}) : null,
			screen === "play" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayScreen, {
				levelId,
				onExit: onExitPlay,
				onComplete
			}) : null,
			screen === "results" && lastRun ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultsScreen, {
				run: lastRun,
				save,
				onHome: () => go("title"),
				onLevels: () => go("levels"),
				onReplay: () => playLevel(lastRun.levelId),
				onNext: () => {
					const n = Math.min(6, lastRun.levelId + 1);
					if (n <= save.unlocked) playLevel(n);
					else go("levels");
				}
			}) : null
		]
	});
}
function Shell({ bg, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-dvh place-items-center bg-dusk-deep",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative h-dvh w-full max-w-[430px] overflow-hidden bg-dusk shadow-[0_0_80px_rgb(0_0_0_/_0.45)] sm:h-[min(100dvh-16px,920px)] sm:rounded-[28px]",
			style: {
				backgroundImage: `linear-gradient(180deg, rgb(35 19 47 / 0.08), rgb(22 10 30 / 0.28)), url(${bg})`,
				backgroundSize: "cover",
				backgroundPosition: "center"
			},
			children
		})
	});
}
function TitleScreen({ save, mute, onMute, onPlay, onLevels, onFamily }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex h-full flex-col px-5 pt-[max(1.2rem,env(safe-area-inset-top))] pb-[max(1.2rem,env(safe-area-inset-bottom))]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-full bg-cream/85 px-3 py-1 text-[11px] font-bold tracking-wide text-ink uppercase",
					children: "KYREC Guardian"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": mute ? "Unmute" : "Mute",
					onClick: onMute,
					className: "grid size-10 place-items-center rounded-full bg-cream/90 text-ink",
					children: mute || isMuted() ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mt-6 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-bold tracking-[0.22em] text-cream uppercase",
						children: "It rains love"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "font-display mt-1 text-[2.35rem] leading-[0.95] font-semibold text-cream drop-shadow-[0_6px_18px_rgb(35_19_47_/_0.45)]",
						children: [
							"Valentine's",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							"Love Dash"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mx-auto mt-3 max-w-[16rem] text-sm leading-snug text-cream/90",
						children: "Catch hearts with the family. Stan throws mid-love. Nova points at the high rollers."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mt-2 min-h-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "/sprites/stan/idle.png",
					alt: "Stan",
					className: "absolute bottom-0 left-[-8%] w-[58%] origin-bottom idle-bob drop-shadow-lg"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "/sprites/nova/cheer.png",
					alt: "Nova",
					className: "absolute right-[-8%] bottom-0 w-[54%] origin-bottom idle-bob-late drop-shadow-lg"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-10 space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "glass-panel flex items-center justify-between rounded-full px-4 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-bold text-ink-soft",
							children: "Family points"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-lg font-semibold text-love tabular-nums",
							children: save.familyPoints.toLocaleString()
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onPlay,
						className: "font-display w-full rounded-full bg-love py-3.5 text-lg font-semibold text-cream shadow-[0_12px_28px_rgb(255_91_138_/_0.38)]",
						children: "Play"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: onLevels,
							className: "rounded-full bg-cream/92 py-3 text-sm font-bold text-ink",
							children: "6 levels"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: onFamily,
							className: "rounded-full bg-cream/92 py-3 text-sm font-bold text-ink",
							children: "Family"
						})]
					})
				]
			})
		]
	});
}
function LevelSelect({ save, onBack, onPlay }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "glass-panel flex items-center gap-2 rounded-[20px] px-2 py-1.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onBack,
					className: "rounded-full bg-cream-deep px-3 py-2 text-sm font-bold text-ink",
					children: "Back"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display flex-1 text-center text-base font-semibold text-ink",
					children: "Choose a sky"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-14" })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5",
			children: LEVELS.map((lv) => {
				const locked = lv.id > save.unlocked;
				const stars = save.levelStars[String(lv.id)] ?? 0;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					disabled: locked,
					onClick: () => onPlay(lv.id),
					className: "relative flex w-full overflow-hidden rounded-[22px] text-left disabled:opacity-70",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: lv.bg,
						alt: "",
						className: "absolute inset-0 h-full w-full object-cover"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex w-full items-center gap-3 bg-dusk/35 px-3 py-3 backdrop-blur-[2px]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-display grid size-11 place-items-center rounded-2xl bg-cream/90 text-lg font-semibold text-ink",
								children: lv.id
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-display text-base font-semibold text-cream",
										children: lv.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-xs text-cream/85",
										children: lv.tagline
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-1 flex gap-0.5",
										children: [
											1,
											2,
											3
										].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: `size-3.5 ${s <= stars ? "fill-gold text-gold" : "text-cream/50"}` }, s))
									})
								]
							}),
							locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-5 text-cream" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "size-5 fill-love text-love" })
						]
					})]
				}, lv.id);
			})
		})]
	});
}
function FamilyScreen({ save, onBack }) {
	const entries = FAMILY.map((m) => ({
		...m,
		score: save.memberScores[m.id]
	}));
	const top = entries.reduce((a, b) => a.score >= b.score ? a : b);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "glass-panel flex items-center gap-2 rounded-[20px] px-2 py-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onBack,
						className: "rounded-full bg-cream-deep px-3 py-2 text-sm font-bold text-ink",
						children: "Back"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display flex-1 text-center text-base font-semibold text-ink",
						children: "Family ledger"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-14" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "glass-panel mt-3 rounded-[24px] p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] font-bold tracking-wide text-ink-soft uppercase",
						children: "KYREC Guardian points"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-4xl font-semibold text-love tabular-nums",
						children: save.familyPoints.toLocaleString()
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-ink-soft",
						children: [
							"Hearts, notes and stars from Love Dash flow into the family pool. Best run ",
							save.bestScore.toLocaleString(),
							" ·",
							" ",
							save.totalHearts.toLocaleString(),
							" hearts all time."
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 grid grid-cols-2 gap-2",
				children: entries.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "glass-panel rounded-[22px] p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: m.portrait,
							alt: "",
							className: "size-12 rounded-full object-cover"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-sm font-semibold text-ink",
							children: m.name
						}), top.id === m.id && top.score > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] font-bold text-gold",
							children: "Love lead"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] font-bold text-ink-soft",
							children: "Guardian"
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display mt-2 text-xl font-semibold text-love tabular-nums",
						children: m.score.toLocaleString()
					})]
				}, m.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-auto pt-4 text-center text-xs leading-relaxed text-cream",
				children: "Stan throws when the love meter glows. Nova never lets a 250-point coin go unnoticed."
			})
		]
	});
}
function ResultsScreen({ run, save, onHome, onLevels, onReplay, onNext }) {
	const level = LEVELS[run.levelId - 1];
	const canNext = run.levelId < 6 && run.levelId + 1 <= save.unlocked;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-full flex-col justify-end px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.2rem,env(safe-area-inset-bottom))]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "glass-panel rounded-[28px] p-5 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] font-bold tracking-wide text-ink-soft uppercase",
					children: level.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-3xl font-semibold text-ink",
					children: "So much love"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 flex justify-center gap-1",
					children: [
						1,
						2,
						3
					].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: `size-8 ${s <= run.stars ? "fill-gold text-gold" : "text-cream-deep"}` }, s))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid grid-cols-3 gap-2 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultStat, {
							label: "Score",
							value: run.score.toLocaleString()
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultStat, {
							label: "Hearts",
							value: String(run.hearts)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultStat, {
							label: "Family",
							value: `+${run.familyPoints}`
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-xs text-ink-soft",
					children: [
						"Combo x",
						run.maxCombo,
						" · ",
						run.coins,
						" high rollers · ",
						run.notes,
						" love notes"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid gap-2",
					children: [
						canNext ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: onNext,
							className: "font-display rounded-full bg-love py-3 font-semibold text-cream",
							children: "Next sky"
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: onReplay,
							className: "rounded-full bg-cream-deep py-3 text-sm font-bold text-ink",
							children: "Play again"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: onLevels,
								className: "rounded-full bg-cream py-3 text-sm font-bold text-ink",
								children: "Levels"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: onHome,
								className: "rounded-full bg-cream py-3 text-sm font-bold text-ink",
								children: "Home"
							})]
						})
					]
				})
			]
		})
	});
}
function ResultStat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-cream-deep/70 px-2 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[10px] font-bold tracking-wide text-ink-soft uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-lg font-semibold text-ink tabular-nums",
			children: value
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameApp, {});
}
//#endregion
export { Home as component };
