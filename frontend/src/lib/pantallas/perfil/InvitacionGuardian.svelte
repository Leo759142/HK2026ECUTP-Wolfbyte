<script>
  import { app } from '../../estado.svelte.js';
  import Header from '../../ui/Header.svelte';
  import Screen from '../../ui/Screen.svelte';
  import InvitacionSheet from './InvitacionSheet.svelte';
</script>

<Screen>
  <Header />
  <InvitacionSheet onClose={app.back} />
</Screen>
