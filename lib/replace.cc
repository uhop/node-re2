#include "./wrapped_re2.h"

#include <algorithm>
#include <memory>
#include <string>
#include <vector>

inline int getMaxSubmatch(
	const char *data,
	size_t size,
	const std::map<std::string, int> &namedGroups)
{
	int maxSubmatch = 0, index, index2;
	const char *nameBegin;
	const char *nameEnd;
	for (size_t i = 0; i < size;)
	{
		char ch = data[i];
		if (ch == '$')
		{
			if (i + 1 < size)
			{
				ch = data[i + 1];
				switch (ch)
				{
				case '$':
				case '&':
				case '`':
				case '\'':
					i += 2;
					continue;
				case '0':
				case '1':
				case '2':
				case '3':
				case '4':
				case '5':
				case '6':
				case '7':
				case '8':
				case '9':
					index = ch - '0';
					if (i + 2 < size)
					{
						ch = data[i + 2];
						if ('0' <= ch && ch <= '9')
						{
							index2 = index * 10 + (ch - '0');
							if (maxSubmatch < index2)
								maxSubmatch = index2;
							i += 3;
							continue;
						}
					}
					if (maxSubmatch < index)
						maxSubmatch = index;
					i += 2;
					continue;
				case '<':
					nameBegin = data + i + 2;
					nameEnd = (const char *)memchr(nameBegin, '>', size - i - 2);
					if (nameEnd)
					{
						std::string name(nameBegin, nameEnd - nameBegin);
						auto group = namedGroups.find(name);
						if (group != namedGroups.end())
						{
							index = group->second;
							if (maxSubmatch < index)
								maxSubmatch = index;
						}
						i = nameEnd + 1 - data;
					}
					else
					{
						i += 2;
					}
					continue;
				}
			}
			++i;
			continue;
		}
		i += getUtf8CharSize(ch);
	}
	return maxSubmatch;
}

inline std::string replace(
	const char *data,
	size_t size,
	const std::vector<re2::StringPiece> &groups,
	const re2::StringPiece &str,
	const std::map<std::string, int> &namedGroups)
{
	std::string result;
	size_t index, index2;
	const char *nameBegin;
	const char *nameEnd;
	for (size_t i = 0; i < size;)
	{
		char ch = data[i];
		if (ch == '$')
		{
			if (i + 1 < size)
			{
				ch = data[i + 1];
				switch (ch)
				{
				case '$':
					result += ch;
					i += 2;
					continue;
				case '&':
					result += (std::string)groups[0];
					i += 2;
					continue;
				case '`':
					result += std::string(str.data(), groups[0].data() - str.data());
					i += 2;
					continue;
				case '\'':
					result += std::string(groups[0].data() + groups[0].size(),
										  str.data() + str.size() - groups[0].data() - groups[0].size());
					i += 2;
					continue;
				case '0':
				case '1':
				case '2':
				case '3':
				case '4':
				case '5':
				case '6':
				case '7':
				case '8':
				case '9':
					index = ch - '0';
					if (i + 2 < size)
					{
						ch = data[i + 2];
						if ('0' <= ch && ch <= '9')
						{
							i += 3;
							index2 = index * 10 + (ch - '0');
							if (index2 && index2 < groups.size())
							{
								result += (std::string)groups[index2];
								continue;
							}
							else if (index && index < groups.size())
							{
								result += (std::string)groups[index];
								result += ch;
								continue;
							}
							result += '$';
							result += '0' + index;
							result += ch;
							continue;
						}
						ch = '0' + index;
					}
					i += 2;
					if (index && index < groups.size())
					{
						result += (std::string)groups[index];
						continue;
					}
					result += '$';
					result += ch;
					continue;
				case '<':
					if (!namedGroups.empty())
					{
						nameBegin = data + i + 2;
						nameEnd = (const char *)memchr(nameBegin, '>', size - i - 2);
						if (nameEnd)
						{
							std::string name(nameBegin, nameEnd - nameBegin);
							auto group = namedGroups.find(name);
							if (group != namedGroups.end())
							{
								index = group->second;
								result += (std::string)groups[index];
							}
							i = nameEnd + 1 - data;
						}
						else
						{
							result += "$<";
							i += 2;
						}
					}
					else
					{
						result += "$<";
						i += 2;
					}
					continue;
				}
			}
			result += '$';
			++i;
			continue;
		}
		size_t sym_size = getUtf8CharSize(ch);
		result.append(data + i, sym_size);
		i += sym_size;
	}
	return result;
}

static Nan::Maybe<std::string> replace(
	WrappedRE2 *re2,
	const StrVal &replacee,
	const char *replacer,
	size_t replacer_size)
{
	const re2::StringPiece str = replacee;
	const char *data = str.data();
	size_t size = str.size();

	const auto &namedGroups = re2->regexp.NamedCapturingGroups();

	std::vector<re2::StringPiece> groups(std::min(re2->regexp.NumberOfCapturingGroups(), getMaxSubmatch(replacer, replacer_size, namedGroups)) + 1);
	const auto &match = groups[0];

	size_t byteIndex = 0;
	std::string result;
	auto anchor = re2::RE2::UNANCHORED;

	if (re2->sticky)
	{
		if (!re2->global)
			byteIndex = replacee.byteIndex;
		anchor = re2::RE2::ANCHOR_START;
	}

	if (byteIndex)
	{
		result = std::string(data, byteIndex);
	}

	bool noMatch = true;
	while (byteIndex <= size && re2->regexp.Match(str, byteIndex, size, anchor, &groups[0], groups.size()))
	{
		noMatch = false;
		auto offset = match.data() - data;
		if (!re2->global && re2->sticky)
		{
			re2->lastIndex +=
				replacee.isBuffer ? offset + match.size() - byteIndex : getUtf16Length(data + byteIndex, match.data() + match.size());
		}
		if (match.data() == data || offset > static_cast<long>(byteIndex))
		{
			result += std::string(data + byteIndex, offset - byteIndex);
		}
		result += replace(replacer, replacer_size, groups, str, namedGroups);
		if (match.size())
		{
			byteIndex = offset + match.size();
		}
		else if ((size_t)offset < size)
		{
			auto sym_size = getUtf8CharSize(data[offset]);
			result.append(data + offset, sym_size);
			byteIndex = offset + sym_size;
		}
		else
		{
			byteIndex = size;
			break;
		}
		if (!re2->global)
		{
			break;
		}
	}
	if (byteIndex < size)
	{
		result += std::string(data + byteIndex, size - byteIndex);
	}

	if (re2->global)
	{
		re2->lastIndex = 0;
	}
	else if (re2->sticky)
	{
		if (noMatch)
			re2->lastIndex = 0;
	}

	return Nan::Just(result);
}

inline Nan::Maybe<std::string> replace(
	const Nan::Callback *replacer,
	const std::vector<re2::StringPiece> &groups,
	const re2::StringPiece &str,
	const v8::Local<v8::Value> &input,
	bool useBuffers,
	const std::map<std::string, int> &namedGroups)
{
	std::vector<v8::Local<v8::Value>> argv;

	auto context = Nan::GetCurrentContext();

	if (useBuffers)
	{
		for (size_t i = 0, n = groups.size(); i < n; ++i)
		{
			const auto &item = groups[i];
			const auto data = item.data();
			if (data)
			{
				argv.push_back(Nan::CopyBuffer(data, item.size()).ToLocalChecked());
			}
			else
			{
				argv.push_back(Nan::Undefined());
			}
		}
		argv.push_back(Nan::New(static_cast<int>(groups[0].data() - str.data())));
	}
	else
	{
		for (size_t i = 0, n = groups.size(); i < n; ++i)
		{
			const auto &item = groups[i];
			const auto data = item.data();
			if (data)
			{
				argv.push_back(Nan::New(data, item.size()).ToLocalChecked());
			}
			else
			{
				argv.push_back(Nan::Undefined());
			}
		}
		argv.push_back(Nan::New(static_cast<int>(getUtf16Length(str.data(), groups[0].data()))));
	}
	argv.push_back(input);

	if (!namedGroups.empty())
	{
		auto groups = Nan::New<v8::Object>();
		Nan::SetPrototype(groups, Nan::Null());

		for (std::pair<std::string, int> group : namedGroups)
		{
			Nan::Set(groups, Nan::New(group.first).ToLocalChecked(), argv[group.second]);
		}

		argv.push_back(groups);
	}

	auto maybeResult = Nan::CallAsFunction(replacer->GetFunction(), context->Global(), static_cast<int>(argv.size()), &argv[0]);

	if (maybeResult.IsEmpty())
	{
		return Nan::Nothing<std::string>();
	}

	auto result = maybeResult.ToLocalChecked();

	if (node::Buffer::HasInstance(result))
	{
		return Nan::Just(std::string(node::Buffer::Data(result), node::Buffer::Length(result)));
	}

	auto t = result->ToString(Nan::GetCurrentContext());
	if (t.IsEmpty())
	{
		return Nan::Nothing<std::string>();
	}

	v8::String::Utf8Value s(v8::Isolate::GetCurrent(), t.ToLocalChecked());
	return Nan::Just(std::string(*s));
}

static Nan::Maybe<std::string> replace(
	WrappedRE2 *re2,
	const StrVal &replacee,
	const Nan::Callback *replacer,
	const v8::Local<v8::Value> &input,
	bool useBuffers)
{
	const re2::StringPiece str = replacee;
	const char *data = str.data();
	size_t size = str.size();

	std::vector<re2::StringPiece> groups(re2->regexp.NumberOfCapturingGroups() + 1);
	const auto &match = groups[0];

	size_t byteIndex = 0;
	std::string result;
	auto anchor = re2::RE2::UNANCHORED;

	if (re2->sticky)
	{
		if (!re2->global)
			byteIndex = replacee.byteIndex;
		anchor = RE2::ANCHOR_START;
	}

	if (byteIndex)
	{
		result = std::string(data, byteIndex);
	}

	const auto &namedGroups = re2->regexp.NamedCapturingGroups();

	bool noMatch = true;
	while (byteIndex <= size && re2->regexp.Match(str, byteIndex, size, anchor, &groups[0], groups.size()))
	{
		noMatch = false;
		auto offset = match.data() - data;
		if (!re2->global && re2->sticky)
		{
			re2->lastIndex += replacee.isBuffer ? offset + match.size() - byteIndex : getUtf16Length(data + byteIndex, match.data() + match.size());
		}
		if (match.data() == data || offset > static_cast<long>(byteIndex))
		{
			result += std::string(data + byteIndex, offset - byteIndex);
		}
		const auto part = replace(replacer, groups, str, input, useBuffers, namedGroups);
		if (part.IsNothing())
		{
			return part;
		}
		result += part.FromJust();
		if (match.size())
		{
			byteIndex = offset + match.size();
		}
		else if ((size_t)offset < size)
		{
			auto sym_size = getUtf8CharSize(data[offset]);
			result.append(data + offset, sym_size);
			byteIndex = offset + sym_size;
		}
		else
		{
			byteIndex = size;
			break;
		}
		if (!re2->global)
		{
			break;
		}
	}
	if (byteIndex < size)
	{
		result += std::string(data + byteIndex, size - byteIndex);
	}

	if (re2->global)
	{
		re2->lastIndex = 0;
	}
	else if (re2->sticky)
	{
		if (noMatch)
		{
			re2->lastIndex = 0;
		}
	}

	return Nan::Just(result);
}

static bool requiresBuffers(const v8::Local<v8::Function> &f)
{
	auto flag(Nan::Get(f, Nan::New("useBuffers").ToLocalChecked()).ToLocalChecked());
	if (flag->IsUndefined() || flag->IsNull() || flag->IsFalse())
	{
		return false;
	}
	if (flag->IsNumber())
	{
		return flag->NumberValue(Nan::GetCurrentContext()).FromMaybe(0) != 0;
	}
	if (flag->IsString())
	{
		return flag->ToString(Nan::GetCurrentContext()).ToLocalChecked()->Length() > 0;
	}
	return true;
}

NAN_METHOD(WrappedRE2::Replace)
{
	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (!re2)
	{
		info.GetReturnValue().Set(info[0]);
		return;
	}

	auto replacee = re2->prepareArgument(info[0]);
	if (replacee.isBad) return; // throws an exception

	if (!replacee.isValidIndex)
	{
		info.GetReturnValue().Set(info[0]);
		return;
	}

	std::string result;

	if (info[1]->IsFunction())
	{
		auto fun = info[1].As<v8::Function>();
		const std::unique_ptr<const Nan::Callback> cb(new Nan::Callback(fun));
		const auto replaced = replace(re2, replacee, cb.get(), info[0], requiresBuffers(fun));
		if (replaced.IsNothing())
		{
			info.GetReturnValue().Set(info[0]);
			return;
		}
		result = replaced.FromJust();
	}
	else
	{
		v8::Local<v8::Object> replacer;
		if (node::Buffer::HasInstance(info[1]))
		{
			replacer = info[1].As<v8::Object>();
		}
		else
		{
			auto t = info[1]->ToString(Nan::GetCurrentContext());
			if (t.IsEmpty())
				return; // throws an exception
			replacer = node::Buffer::New(v8::Isolate::GetCurrent(), t.ToLocalChecked()).ToLocalChecked();
		}

		auto data = node::Buffer::Data(replacer);
		auto size = node::Buffer::Length(replacer);

		const auto replaced = replace(re2, replacee, data, size);
		if (replaced.IsNothing())
		{
			info.GetReturnValue().Set(info[0]);
			return;
		}
		result = replaced.FromJust();
	}

	if (replacee.isBuffer)
	{
		info.GetReturnValue().Set(Nan::CopyBuffer(result.data(), result.size()).ToLocalChecked());
		return;
	}
	info.GetReturnValue().Set(Nan::New(result).ToLocalChecked());
}
