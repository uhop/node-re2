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
        "vendor/re2/re2/bitmap256.cc",
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
        "vendor/re2/util/pcre.cc",
        "vendor/re2/util/rune.cc",
        "vendor/re2/util/strutil.cc",
        "vendor/abseil-cpp/absl/base/internal/cycleclock.cc",
        "vendor/abseil-cpp/absl/base/internal/raw_logging.cc",
        "vendor/abseil-cpp/absl/container/internal/raw_hash_set.cc",
        "vendor/abseil-cpp/absl/debugging/symbolize.cc",
        "vendor/abseil-cpp/absl/flags/commandlineflag.cc",
        "vendor/abseil-cpp/absl/flags/internal/flag.cc",
        "vendor/abseil-cpp/absl/flags/reflection.cc",
        "vendor/abseil-cpp/absl/flags/usage_config.cc",
        "vendor/abseil-cpp/absl/hash/internal/hash.cc",
        "vendor/abseil-cpp/absl/hash/internal/low_level_hash.cc",
        "vendor/abseil-cpp/absl/strings/ascii.cc",
        "vendor/abseil-cpp/absl/strings/internal/str_format/arg.cc",
        "vendor/abseil-cpp/absl/strings/string_view.cc",
        "vendor/abseil-cpp/absl/strings/numbers.cc",
        "vendor/abseil-cpp/absl/synchronization/mutex.cc",
      ],
      "cflags": [
        "-std=c++2a",
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
        "vendor/re2",
        "vendor/abseil-cpp",
      ],
      "xcode_settings": {
        "MACOSX_DEPLOYMENT_TARGET": "10.7",
        "CLANG_CXX_LANGUAGE_STANDARD": "c++2a",
        "CLANG_CXX_LIBRARY": "libc++",
        "OTHER_CFLAGS": [
          "-std=c++2a",
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
