function result(e, target, name) {
	const defaultValue = e.getAttribute("data-default");
	if (e.tagName === "INPUT") {
		e.value = Reflect.get(target, name) || defaultValue;
	}
	e.innerText = Reflect.get(target, name) || defaultValue;
}

function base(e, target, name) {
	e.value = Reflect.get(target, name);
}

function track(target, name) {
	if (!deps.has(name)) {
		const effect = () =>
			document
				.querySelectorAll(`*[connection=${name}]`)
				.forEach((e) => result(e, target, name));
		deps.set(name, effect);
	}
}

function trigger(name) {
	const effect = deps.get(name);
	effect();
}

function spanError(target) {
	target.classList.add("error");
	if (!(target.parentNode.children[target.parentNode.children.length - 1].id === "spanError")) {
		createChild(target.parentNode, "span", {
			id: "spanError",
			classes: ["text-error", "error"],
			content: "formato no valido",
			styles: "grid-row: 3;grid-column: 1 / -1;color: var(--color-input-error);"
		});
	}
}

function createChild(target, typeChild, params) {
	const child = document.createElement(typeChild);
	child.setAttribute("id", params.id);
	child.setAttribute("style", params.styles);
	params.classes.map((e) => child.classList.add(e));
	typeChild === "span" ? (child.innerText = params.content) : false;
	typeChild !== "span"
		? (target.appendChild(child).innerHTML = params.content)
		: target.appendChild(child);
}

function deleteError(target) {
	document.querySelectorAll(".text-error").forEach((item) => target.parentNode.removeChild(item));
}

const self = this;

const form = document.querySelector("form");
form.addEventListener("submit", (e) => {
	e.preventDefault();
	form.style = "display: none";
	const values = {
		id: "success",
		classes: ["success"],
		content: `
			<figure style="width: 5rem">
				<img src="./public/icon-complete.svg" alt="icon-success" />
			</figure>
			<h2
				style="
					font-size: 2rem;
					font-weight: 700;
					margin: 0.5rem 0%;
					color: var(--color-dark-violet);
				"
			>
				Thank you!
			</h2>
			<p style="color: var(--color-dark-gray-violet)">We've added your card details</p>
			<button type="submit" style="width: 15rem" onClick="document.location.reload()">Continue</button>
			`,
		styles: "display: flex;flex-direction: column;width: clamp(50%, 80%, 90%);align-items: center;gap: 0.5rem;padding: 1rem 0rem;margin: auto 0%"
	};
	createChild(form.parentNode, "section", values);
});

const btn = document.querySelector("#btn-continue");

const origin = {
	name: "",
	cardNumber: "",
	month: "",
	year: "",
	cvc: ""
};

const proxy = new Proxy(origin, {
	get(target, name) {
		if (Reflect.has(target, name)) {
			self.track(target, name);
			return Reflect.get(target, name);
		}
		console.warn(`The property ${name} don't exist`);
		return "";
	},
	set(target, name, newValue) {
		Reflect.set(target, name, newValue);
		self.trigger(name);
	}
});

const deps = new Map();

const value = document.querySelectorAll("*[connection]").forEach((e) => {
	result(e, proxy, e.getAttribute("connection"));
});

const model = document.querySelectorAll("*[model]").forEach((e) => {
	const name = e.getAttribute("model");
	base(e, proxy, name);
	let counter = 0;
	e.addEventListener("input", (event) => {
		if (event.inputType === "deleteContentBackward" || e.value.length === 0) {
			deleteError(e);
			e.classList.remove("error");
		}
		if (e.getAttribute("name") === "numberCard") {
			counter++;
			if (counter === 4 && e.value.length < 18) {
				e.value += " ";
				counter = 0;
			}
			if (e.value.length === 0) counter = 0;
			if (e.value.match(/[a-zA-Z]/gm)) {
				spanError(e);
			}
		}
		if (e.getAttribute("name") === "yearCard" || e.getAttribute("name") === "monthCard") {
			if (e.value.length > 2) {
				spanError(e);
			} else if (e.getAttribute("name") === "monthCard" && e.value > 12) {
				spanError(e);
			}
		}
		if (e.getAttribute("name") === "cvcCard" && e.value.length > 3) {
			spanError(e);
		}
		// proxy[name] = e.value;
		Reflect.set(proxy, name, e.value);
	});
});
