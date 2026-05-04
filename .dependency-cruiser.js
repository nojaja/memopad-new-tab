/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: '循環依存を禁止する',
      from: {},
      to: {
        circular: true
      }
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: '孤立モジュール（インポートもエクスポートもされていない）を警告する',
      from: {
        orphan: true,
        pathNot: [
          '\\.(d\\.ts|spec\\.ts|test\\.ts)$',
          'shims-vue\\.d\\.ts'
        ]
      },
      to: {}
    },
    {
      name: 'no-deprecated-core',
      severity: 'warn',
      comment: '非推奨のNode.jsコアモジュールの使用を警告する',
      from: {},
      to: {
        dependencyTypes: ['core'],
        path: '^(v8\/tools\/codemap)$|^(v8\/tools\/consarray)$|^(v8\/tools\/csvparser)$|^(v8\/tools\/logreader)$|^(v8\/tools\/profile_view)$|^(v8\/tools\/splaytree)$|^(node-uuid)$'
      }
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    tsConfig: {
      fileName: './tsconfig.json'
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue', '.d.ts']
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+'
      },
      archi: {
        collapsePattern: '^(node_modules|packages|src|lib|app|bin|test(s?)|spec(s?))/[^/]+'
      }
    }
  }
}
