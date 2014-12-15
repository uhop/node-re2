{
  "targets": [
    {
      "target_name": "re2",
      "sources": [
        "lib/addon.cc",
        "lib/new.cc",
        "lib/exec.cc",
        "lib/test.cc",
        "lib/match.cc",
        "lib/replace.cc",
        "lib/search.cc",
        "lib/split.cc",
        "lib/toString.cc",
        "lib/accessors.cc",
        "lib/util.cc",
        "vendor/re2/re2/bitstate.cc",
        "vendor/re2/re2/compile.cc",
        "vendor/re2/re2/dfa.cc",
        "vendor/re2/re2/filtered_re2.cc",
        "vendor/re2/re2/mimics_pcre.cc",
        "vendor/re2/re2/nfa.cc",
        "vendor/re2/re2/onepass.cc",
        "vendor/re2/re2/parse.cc",
        "vendor/re2/re2/perl_groups.cc",
        "vendor/re2/re2/prefilter.cc",
        "vendor/re2/re2/prefilter_tree.cc",
        "vendor/re2/re2/prog.cc",
        "vendor/re2/re2/re2.cc",
        "vendor/re2/re2/regexp.cc",
        "vendor/re2/re2/set.cc",
        "vendor/re2/re2/simplify.cc",
        "vendor/re2/re2/tostring.cc",
        "vendor/re2/re2/unicode_casefold.cc",
        "vendor/re2/re2/unicode_groups.cc",
        "vendor/re2/util/arena.cc",
        "vendor/re2/util/hash.cc",
        "vendor/re2/util/rune.cc",
        "vendor/re2/util/stringpiece.cc",
        "vendor/re2/util/stringprintf.cc",
        "vendor/re2/util/strutil.cc",
        "vendor/re2/util/valgrind.cc"
      ],
      "cflags": [
        "-Wall",
        "-Wno-sign-compare",
        "-Wmissing-field-initializers",
        "-O3",
        "-g"
      ],
      "defines": [
        "NDEBUG"
      ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")",
        "vendor/re2"
      ],
      "xcode_settings": {
        "OTHER_CFLAGS": [
          "-Wall",
          "-Wno-sign-compare",
          "-Wunused-local-typedefs",
          "-Wmissing-field-initializers",
          "-O3",
          "-g"
        ]
      },
      "conditions": [
        ["OS==\"linux\"", {
          "cflags": [
            "-pthread"
          ],
          "ldflags": [
            "-pthread"
          ]
        }]
      ]
    }
  ]
}
