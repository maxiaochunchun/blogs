---
title: 后端一次返回10万条数据，如何处理数据并展示到页面？
date: 2022-8-19
categories: 前端
tags: 性能优化
sticky: 1

---

## 前言

前段时间接手了一个项目，一天发现进入一个模块页面时每次都很卡顿排查发现一个下拉框的数据源后端一次性返回了2万条数据，之前做这个功能的前端估计也没考虑到后续数据会这么大直接渲染到页面。刚好最近刷到过相关的面试题，这里对相关方案做个总结。

## 前置工作

先还原问题场景和相关代码

### 后端搭建mock数据

新建server.js文件，循环生成10万条数据，node启动服务

```
// server.js

import  http  from 'http';

http.createServer(function (req, res) {
  // 开启Cors
  res.writeHead(200, {
    //设置*允许跨域
    'Access-Control-Allow-Origin': '*',
    "Access-Control-Allow-Methods": '*',
  })
  let list = []
  let value = 0

  // 生成1万条数据的list
  for (let i = 0; i < 100000; i++) {
    value++
    list.push({
      label: `选项${value}`,
      value: value,
    })
  }
  res.end(JSON.stringify(list));
}).listen('8000')
```

```
 // 启动服务
 node server
```

### 前端vue

```
<script setup>
  import {ref,onMounted, nextTick} from "vue";

  const list =ref([])
  // ajax请求获取后端返回所有数据
  const getList = () => {
    return new Promise((resolve, reject) => {
      var ajax = new XMLHttpRequest();
      ajax.open('get', 'http://127.0.0.1:8000');
      ajax.send();
      ajax.onreadystatechange = function () {
        if (ajax.readyState == 4 && ajax.status == 200) {
          resolve(JSON.parse(ajax.responseText))
        }
      }
    })
  }
  onMounted( ()=>{
    // 渲染全部数据
    renderAll()

    // setTimeout渲染
    renderSetTimeOut()

    // requestAnimationFrame渲染
    renderRequestAnimationFrame()

    // 懒加载
    // renderLazy()

    // 虚拟列表渲染
    renderVoidList()
  })
</script>

<template>
  <div id="container">
    <el-select
        clearable
    >
      <el-option v-for="op in list" :key="op.value" :label="op.label" :value="op.value"></el-option>
    </el-select>
  </div>
</template>
```

## 接收数据后直接渲染

先看看卡顿的问题根源，一次性渲染10万个dom节点消耗时间导致卡顿，由于10万条数据测试卡顿太久，这里我用1万条数据测试渲染时间约为20s

```
const renderAll = async () => { 
 console.time()
 list.value = await getList()
 await nextTick()
 console.timeEnd()
}
```

## setTimeout渲染

定时器虽然解决了首次渲染卡死的问题，但是由于是定时任务一直在不断的添加dom节点进行重排，所以打开下拉框后滑动依然会很卡且很消耗资源

```
const renderSetTimeOut = async () => {
  const listAll = await getList()
  const total = listAll.length
  const page = 0
  const pageSize = 300
  const totalPage = Math.ceil(total / pageSize)

  const render = (page) => {
    if (page >= totalPage) return
    setTimeout(() => {
      // 每隔一段时间截取下页的数据渲染
      const array = listAll.slice(page * pageSize, (page + 1) * pageSize)
      list.value = list.value.concat(array)
      render(page + 1)
    }, 0)
  }
  render(page)
}
```

## requestAnimationFrame

requestAnimationFrame跟setTimeout 的原理一样都是定时循环，只不过在动画帧上渲染的性能和效果更好。这里最终的结果跟setTimeout都存在一样的问题

```
const renderRequestAnimationFrame = async () => {
  const listAll = await getList()
  const total = listAll.length
  const page = 0
  const pageSize = 300
  const totalPage = Math.ceil(total / pageSize)

  const render = (page) => {
    if (page >= totalPage) return
    requestAnimationFrame(() => {
      const array = listAll.slice(page * pageSize, (page + 1) * pageSize)
      list.value = list.value.concat(array)
      render(page+1)
    })
  }
  render(page)
}
```

## 懒加载

对返回的所有数据进行分页处理，默认渲染第一页的数据，每次**触发触底加载下一页数据**

## 自定义指令触发触底

找到下拉弹窗的dom节点并监听滚动，触底触发绑定的函数

```
// 自定义指定触底
const loadMoreDirective = {
  mounted(el, binding) {
    // 找到下拉滚动节点
    let select_dom = document.querySelector('.el-select-dropdown .el-select-dropdown__wrap');
    select_dom.addEventListener('scroll', function () {
      // 确定滚动区域是否滚动到底
      let height = this.scrollHeight - this.scrollTop <= this.clientHeight;
      if (height) {
        binding.value(binding.arg)
      }
    })
  },
}

const vLoadMore = loadMoreDirective
```

## 触底加载更多

```
const loadMore = () => {
  const total = listAll.value.length
  const pageSize = 300
  const totalPage = Math.ceil(total / pageSize)
  if (page.value >= totalPage) return
  page.value++
  const array = listAll.value.slice(page.value * pageSize, (page.value + 1) * pageSize)
  list.value = list.value.concat(array)
}

const page = ref(0)
const listAll = ref([])
// 加载首页数据和所有数据
const renderLazy = async () => {
  listAll.value = await getList()
  const pageSize = 300
  const array = listAll.value.slice(page.value * pageSize, (page.value + 1) * pageSize)
  list.value = list.value.concat(array)
}
```

## 实现效果图

每次触底加载下一页300条数据

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/afeebdf5891441ec90fce49d3eb9252b~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image)

## 虚拟列表

### 虚拟列表的理解

**渲染可视区域**内的数据，**不渲染非可视区域**内数据，同时列表中监听滚动条滚动事件，

动态截取所有数据中需要渲染的数据到可视区域内

![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ef2d10b20f5445b393392e1cbb662bcd~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image)

```
<template>
  <el-select
      clearable
      v-scroll="loadScroll"
      popper-class="custom-popper"
  >
    <el-option v-for="op in visibleList" :key="op.value" :label="op.label" :value="op.value"></el-option>
  </el-select>
</template>

<script setup>
import {ref, onMounted, computed} from "vue";

// 节流
const throttle =(func, delay) => {
  let timer = null;

  return function() {
    const context = this;
    const args = arguments;

    if (!timer) {
      timer = setTimeout(function() {
        func.apply(context, args);
        timer = null;
      }, delay);
    }
  }
}
// 滚动自定义指令
const scrollDirective = {
  mounted(el, binding) {
    // 找到下拉滚动dom节点
    let select_dom = document.querySelector('.custom-popper .el-select-dropdown__wrap');
    select_dom.addEventListener('scroll', function () {
      binding.value(this.scrollTop)
    })
  },
}
const vScroll = scrollDirective

// 下拉选项高度
const itemHeight = ref(34)
// 可视区域高度即下拉框滚动区域高度
const screenHeight = ref(274)
// 开始索引
const startIndex = ref(0)
// 结束索引，可视区域 / 下拉项高度 * 2 = 可视区域内展示多少项 * 2
// 274 / 34 * 2 = 16 多加载一屏数据防止滑动过快出现白屏
const endIndex = ref(16)
// 所有下拉选项数据
const listAll = ref([])
// 可视区域计算截取需要显示的数据
const visibleList = computed(() => {
  return listAll.value.slice(startIndex.value, endIndex.value);
})

const getList = () => {
  return new Promise((resolve, reject) => {
    var ajax = new XMLHttpRequest();
    ajax.open('get', 'http://127.0.0.1:8000');
    ajax.send();
    ajax.onreadystatechange = function () {
      if (ajax.readyState == 4 && ajax.status == 200) {
        //步骤五 如果能够进到这个判断 说明 数据 完美的回来了,并且请求的页面是存在的
        resolve(JSON.parse(ajax.responseText))
      }
    }
  })
}

// 滚动节流提高性能
const loadScroll = throttle((scrollHeight) => {
  // 已滚动的高度 / 单个选项高度  = 已滚动选项即当前开始索引
  startIndex.value =  Math.floor(scrollHeight / itemHeight.value)
  // 可视区域展示8项，多加载一屏防止白屏
  endIndex.value = startIndex.value + 16;
  // 获取滚动区域dom节点
  let dropdownListDom = document.querySelector('.custom-popper .el-select-dropdown__list')
  // 计算上方已滚动下拉项高度模拟设置滚动条的位置： 开始索引*下拉选项高度 = 上方已滚动高度
  // 因element默认样式设置了important，所以需要覆盖原样式
  dropdownListDom.style.setProperty('padding-top', startIndex.value*itemHeight.value + 'px', 'important');
},50)

const renderVoidList = async () => {
  listAll.value = await getList()
  // 获取所有数据后，设置ul节点的高度撑开容器，模拟所有数据都存在时滚动条的位置
  let dropdownListDom = document.querySelector('.custom-popper .el-select-dropdown__list')
  dropdownListDom.style.height = listAll.value.length  * itemHeight.value +`px`;
}

onMounted(() => {
  renderVoidList()
})
</script>
```

## 实现效果图

![](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/af729dec4b4a4551bde72091a537ac1a~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image)