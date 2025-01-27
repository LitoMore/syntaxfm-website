<script lang="ts">
	import { clickOutDialog } from '$/actions/click_outside_dialog';
	import { episode_share_status, player } from '$/state/player';
	import Icon from '$lib/Icon.svelte';
	import { Show } from '@prisma/client';
	import toast from 'svelte-french-toast';
	let modal: HTMLDialogElement;
	export let show: Show;
	let share_at_ts = false;

	async function close() {
		$episode_share_status = false;
	}

	const toHMS = (seconds: number) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		// Formatting to ensure two digits for minutes and seconds
		const formattedMinutes = minutes.toString().padStart(2, '0');
		const formattedSeconds = secs.toString().padStart(2, '0');

		return `${hours}:${formattedMinutes}:${formattedSeconds}`;
	};

	$: if ($episode_share_status) {
		if (modal) {
			modal.showModal();
		}
	}

	$: if (!$episode_share_status) {
		if (modal) {
			modal.close();
		}
	}

	function copy(link: string) {
		navigator.clipboard.writeText(decodeURIComponent(link));
		toast.success(`Copied show link to clipboard`);
	}

	$: time_stamp = share_at_ts ? `%3Ft%3D${toHMS(Math.trunc($player.audio?.currentTime))}` : ``;
	$: share_url = `https%3A//syntax.fm/${show.number}${time_stamp}`;
</script>

<dialog
	bind:this={modal}
	class="zone"
	style:--bg="var(--bg-sheet)"
	style:--fg="var(--fg-sheet)"
	use:clickOutDialog
	on:click-outside={close}
	aria-labelledby="search-header"
>
	<h3>Share</h3>
	<section aria-label="Share Window" class="share-window">
		<button on:click={close} class="close">×</button>
		<p>
			<label>
				<input bind:checked={share_at_ts} type="checkbox" />
			</label>
			Start at: <input type="text" value={toHMS(Math.trunc($player.audio?.currentTime))} />
		</p>

		<!-- TODO add back embed -->
		<!-- <button><Icon name="code" /> Embed</button> -->
		<button on:click={() => copy(share_url)}><Icon name="link" /> Link</button>
		<a
			class="button share--x"
			target="_blank"
			href="https://twitter.com/intent/tweet?url={share_url}&text={show.title}&via=syntaxfm"
			><Icon name="x" /> X</a
		>
		<a
			class="button share--facebook"
			target="_blank"
			href="https://facebook.com/sharer/sharer.php?u={share_url}&quote={show.title}"
			><Icon name="facebook" /> Facebook</a
		>
		<a
			target="_blank"
			class="button share--linkedin"
			href="https://www.linkedin.com/sharing/share-offsite/?url={share_url}"
			><Icon name="linkedin" /> LinkedIn</a
		>
	</section>
</dialog>

<style lang="postcss">
	.close {
		position: absolute;
		top: 10px;
		right: 10px;
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0.8);
	}

	.share--x {
		--button-bg: linear-gradient(to bottom, var(--black-7) 0%, var(--black-8) 100%);
		--button-fg: var(--white);
	}

	.share--facebook {
		--button-bg: linear-gradient(to bottom, #57b1f9 0%, #2d64f6 100%);
		--button-fg: var(--white);
	}
	.share--linkedin {
		--button-bg: linear-gradient(to bottom, #57b1f9 0%, #2d64bc 100%);
		--button-fg: var(--white);
	}
</style>
