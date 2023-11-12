<script lang="ts">
  function createVariants(inp) {
    // start by converting all optional groups to paren groups
    let answer = ("(" + inp + ")")
      .replace(/[a-z]/g, (v) => `(/${v.toUpperCase()})`)
      .replace(/\*/g, "(/*)")
      .replace(/\+/g, "(/ )")
      .replace(/\[/g, "(/")
      .replace(/\]/g, ")");
    let output = [{ state: 0, value: answer }];
    let cost = 0;
    const frames = [];

    for (let i = 0; i < output.length; ++i) {
      const data = output[i];
      if (data.state >= 2) {
        continue; // entry is finished
      }
      frames.push(output.slice(0));
      cost += 1;

      if (data.state === 1 && !data.value.includes("(")) {
        output[i] = { ...output[i], state: 2 };
        i = -1;
        continue;
      }

      let start = data.value.indexOf("(") + 1;
      let prefix = data.value.slice(0, start - 1);
      let nested = 0;
      let result = [];
      let j = start;
      for (j = start; j < data.value.length; ++j) {
        if (data.value[j] === "(") {
          nested += 1;
          continue;
        } else if (data.value[j] === ")" && nested) {
          nested -= 1;
          continue;
        } else if (data.value[j] === ")") break;
        if (nested) continue;

        if (data.value[j] === "/") {
          result.push(data.value.slice(start, j));
          start = j + 1;
        }
      }
      const suffix = data.value.slice(j + 1);

      result.push(data.value.slice(start, j));

      output.splice(
        i,
        1,
        ...result.map((value) => ({ state: 1, value: prefix + value + suffix }))
      );
      i = -1;
    }

    frames.push(output.slice(0));
    return frames;
  }

  let value: string = "RELATIVE/AUNT/UNCLE/GRAND(+PARENT/MA/PA)";
  function focus() {
    value = '';
  }
  $: frames = createVariants(value);
</script>

<main>
  <input on:click={focus} type="text" bind:value />

  <div>Creating answers takes <strong>{frames.length}</strong> frames.</div>
  {#each frames as variant}
    <ul class="variants">
      {#each variant as answer}
        <li class:done={answer.state === 2}>{answer.value}</li>
      {/each}
    </ul>
  {/each}
</main>

<style>
  .variants {
    display: flex;
    list-style: none;
    gap: 24px;
    align-content: center;
    justify-content: center;
    margin: 24px 0;
    padding: 0;
  }
  .variants > * {
    padding: 8px;
    background: #ffaaaa;
  }
  .variants > .done {
    background: #55ff55;
  }
</style>
