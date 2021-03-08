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
        "lib/to_string.cc",
        "lib/accessors.cc",
        "lib/util.cc",
        "vendor/re2/bitstate.cc",
        "vendor/re2/compile.cc",
        "vendor/re2/dfa.cc",
        "vendor/re2/filtered_re2.cc",
        "vendor/re2/mimics_pcre.cc",
        "vendor/re2/nfa.cc",
        "vendor/re2/onepass.cc",
        "vendor/re2/parse.cc",
        "vendor/re2/perl_groups.cc",
        "vendor/re2/prefilter.cc",
        "vendor/re2/prefilter_tree.cc",
        "vendor/re2/prog.cc",
        "vendor/re2/re2.cc",
        "vendor/re2/regexp.cc",
        "vendor/re2/set.cc",
        "vendor/re2/simplify.cc",
        "vendor/re2/stringpiece.cc",
        "vendor/re2/tostring.cc",
        "vendor/re2/unicode_casefold.cc",
        "vendor/re2/unicode_groups.cc",
        "vendor/util/pcre.cc",
        "vendor/util/rune.cc",
        "vendor/util/strutil.cc"
      ],
      "cflags": [
        "-std=c++14",
        "-Wall",
        "-Wextra",
        "-Wno-sign-compare",
        "-Wno-unused-parameter",
        "-Wno-missing-field-initializers",
        "-Wno-cast-function-type",
        "-O3",
        "-g"
      ],
      "defines": [
        "NDEBUG",
        "NOMINMAX"
      ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")",
        "vendor"
      ],
      "xcode_settings": {
        "MACOSX_DEPLOYMENT_TARGET": "10.7",
        "CLANG_CXX_LANGUAGE_STANDARD": "c++11",
        "CLANG_CXX_LIBRARY": "libc++",
        "OTHER_CFLAGS": [
          "-std=c++14",
          "-Wall",
          "-Wextra",
          "-Wno-sign-compare",
          "-Wno-unused-parameter",
          "-Wno-missing-field-initializers",
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
